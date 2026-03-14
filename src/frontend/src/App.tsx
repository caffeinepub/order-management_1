import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Layers,
  Loader2,
  PackageSearch,
  PauseCircle,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Settings,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AppRole, AppUser, Order } from "./backend.d";
import { AuditLogTab } from "./components/AuditLogTab";
import { DeleteConfirm } from "./components/DeleteConfirm";
import { OrderDetailDrawer } from "./components/OrderDetailDrawer";
import { OrderFilterTab } from "./components/OrderFilterTab";
import { OrderForm } from "./components/OrderForm";
import type { FormData } from "./components/OrderForm";
import { SettingsTab } from "./components/SettingsTab";
import { StagesTab } from "./components/StagesTab";
import { UsersTab } from "./components/UsersTab";
import {
  useCreateOrder,
  useDeleteOrder,
  useGetCurrentUser,
  useListAllClear,
  useListCollectToday,
  useListExpectedPayment,
  useListHeld,
  useListOrders,
  useListPending,
  useListRoles,
  useListStages,
  useMarkAllClear,
  useMarkHold,
  useRegisterSelf,
  useSearchOrders,
  useSetAllClearFlag,
  useSetHoldFlag,
  useUnmarkAllClear,
  useUnmarkHold,
  useUpdateOrder,
} from "./hooks/useQueries";

const queryClient = new QueryClient();
const PAGE_SIZE = 10;

const SKELETON_ROWS = Array.from(
  { length: PAGE_SIZE },
  (_, i) => `skel-row-${i}`,
);
const SKELETON_COLS = Array.from({ length: 9 }, (_, i) => `skel-col-${i}`);

function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-primary/20 text-primary border-primary/30";
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "cancelled":
      return "bg-destructive/20 text-red-400 border-destructive/30";
    case "on-hold":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function isAdmin(user: AppUser | null | undefined): boolean {
  return !!user?.roleIds.includes(1n);
}

function isManagerOrAdmin(user: AppUser | null | undefined): boolean {
  return !!user?.roleIds.some((id) => id === 1n || id === 2n);
}

function getRoleNames(roleIds: bigint[], roles: AppRole[]): string[] {
  return roleIds.map(
    (rid) => roles.find((r) => r.id === rid)?.roleName ?? `Role ${rid}`,
  );
}

// ─── Registration Gate ─────────────────────────────────────────────────────
function RegistrationGate({ onRegistered }: { onRegistered: () => void }) {
  const [username, setUsername] = useState("");
  const registerMutation = useRegisterSelf();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const result = await registerMutation.mutateAsync(username.trim());
      if (result === "ok" || result === "already_registered") {
        toast.success("Welcome! You are now registered.");
        onRegistered();
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      data-ocid="register.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-sm bg-primary flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Order Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your account to get started
          </p>
        </div>
        <form
          onSubmit={handleRegister}
          className="space-y-4 bg-card border border-border rounded-sm p-6"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="reg-username"
              className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
            >
              Username *
            </label>
            <Input
              id="reg-username"
              data-ocid="register.input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              className="bg-input border-border h-9 text-sm"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={registerMutation.isPending || !username.trim()}
            data-ocid="register.submit_button"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9"
          >
            {registerMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {registerMutation.isPending ? "Registering..." : "Register"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── User Chip ─────────────────────────────────────────────────────────────
function UserChip({ user, roles }: { user: AppUser; roles: AppRole[] }) {
  const roleNames = getRoleNames(user.roleIds, roles);
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold text-foreground">
          {user.username}
        </span>
        <div className="flex gap-1">
          {roleNames.length > 0 ? (
            roleNames.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="text-xs px-1.5 py-0 h-4"
              >
                {name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No roles</span>
          )}
        </div>
      </div>
      <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center">
        <span className="text-xs font-bold text-muted-foreground">
          {user.username.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ─── Orders Tab ────────────────────────────────────────────────────────────
function OrdersTab({
  currentUser,
  onViewDetail,
}: {
  currentUser: AppUser | null | undefined;
  onViewDetail: (order: Order) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [holdPending, setHoldPending] = useState<bigint | null>(null);
  const [allClearPending, setAllClearPending] = useState<bigint | null>(null);

  const canCreate = !!currentUser;
  const canEdit = isManagerOrAdmin(currentUser);
  const canDelete = isAdmin(currentUser);

  const isSearching = search.trim().length > 0;

  const listQuery = useListOrders(page, PAGE_SIZE);
  const searchQuery = useSearchOrders(search);
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();
  const setHoldFlagMutation = useSetHoldFlag();
  const setAllClearFlagMutation = useSetAllClearFlag();

  const orders = isSearching
    ? (searchQuery.data ?? [])
    : (listQuery.data?.orders ?? []);
  const total = listQuery.data?.total ?? 0n;
  const totalPages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));
  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading;

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const clearSearch = () => {
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleCreate = async (data: FormData) => {
    try {
      const id = await createMutation.mutateAsync(data);
      toast.success(`Order #${id} created successfully`);
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create order");
    }
  };

  const handleUpdate = async (data: FormData) => {
    if (!editOrder) return;
    try {
      await updateMutation.mutateAsync({
        id: editOrder.id,
        ...data,
        status: data.status ?? editOrder.status,
      });
      toast.success(`Order #${editOrder.id} updated`);
      setEditOrder(null);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Order #${deleteTarget.id} deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const handleToggleHold = async (order: Order) => {
    setHoldPending(order.id);
    try {
      await setHoldFlagMutation.mutateAsync({
        id: order.id,
        value: !order.holdFlag,
      });
      toast.success("Hold flag updated");
    } catch {
      toast.error("Failed to update hold flag");
    } finally {
      setHoldPending(null);
    }
  };

  const handleToggleAllClear = async (order: Order) => {
    setAllClearPending(order.id);
    try {
      await setAllClearFlagMutation.mutateAsync({
        id: order.id,
        value: !order.allClearFlag,
      });
      toast.success("All-clear flag updated");
    } catch {
      toast.error("Failed to update all-clear flag");
    } finally {
      setAllClearPending(null);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-ocid="order.search_input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by ID, consumer no, contact..."
            className="pl-8 pr-8 h-8 bg-input border-border text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          data-ocid="order.search.button"
          variant="secondary"
          size="sm"
          className="h-8 text-sm"
        >
          Search
        </Button>
        {isSearching && (
          <span className="text-xs text-muted-foreground">
            {searchQuery.data?.length ?? 0} result
            {(searchQuery.data?.length ?? 0) !== 1 ? "s" : ""} for &ldquo;
            {search}&rdquo;
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {!isSearching &&
            `${Number(total)} order${Number(total) !== 1 ? "s" : ""} total`}
        </span>
        {canCreate && (
          <Button
            onClick={() => setCreateOpen(true)}
            data-ocid="order.create.open_modal_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-8 text-sm gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Order
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-sm overflow-hidden">
        <Table data-ocid="order.table">
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider w-12">
                ID
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Consumer No
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Customer
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Contact
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Product
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-right">
                Amount
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Pay Date
              </TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKELETON_ROWS.map((rowKey, i) => (
                <TableRow key={rowKey} className="border-border">
                  {SKELETON_COLS.map((colKey, j) => (
                    <TableCell key={colKey}>
                      <Skeleton
                        className="h-4 w-full bg-muted/40"
                        data-ocid={
                          i === 0 && j === 0 ? "order.loading_state" : undefined
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={9}
                  className="py-16 text-center"
                  data-ocid="order.empty_state"
                >
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <PackageSearch className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">
                      {isSearching
                        ? `No orders match "${search}"`
                        : "No orders yet"}
                    </p>
                    {!isSearching && canCreate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreateOpen(true)}
                        className="text-primary hover:text-primary"
                      >
                        Create your first order
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {orders.map((order, idx) => (
                  <motion.tr
                    key={order.id.toString()}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.15 }}
                    className="order-row border-border border-b last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`order.row.item.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.id.toString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {order.consumerNo}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.contactNo}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                      {order.product}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono text-foreground">
                      {order.amountText}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${getStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                        {order.holdFlag && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center">
                                <PauseCircle className="w-3.5 h-3.5 text-yellow-400" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>On hold</TooltipContent>
                          </Tooltip>
                        )}
                        {order.allClearFlag && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>All clear</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.expectedPaymentDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {canEdit && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleHold(order)}
                                  disabled={holdPending === order.id}
                                  data-ocid={`order.hold_toggle.${idx + 1}`}
                                  className={`h-6 w-6 transition-colors ${
                                    order.holdFlag
                                      ? "text-yellow-400 hover:text-yellow-300"
                                      : "text-muted-foreground hover:text-yellow-400"
                                  }`}
                                >
                                  {holdPending === order.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <PauseCircle className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {order.holdFlag
                                  ? "Remove hold"
                                  : "Mark as held"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleAllClear(order)}
                                  disabled={allClearPending === order.id}
                                  data-ocid={`order.allclear_toggle.${idx + 1}`}
                                  className={`h-6 w-6 transition-colors ${
                                    order.allClearFlag
                                      ? "text-green-400 hover:text-green-300"
                                      : "text-muted-foreground hover:text-green-400"
                                  }`}
                                >
                                  {allClearPending === order.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {order.allClearFlag
                                  ? "Remove all-clear"
                                  : "Mark all clear"}
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditOrder(order)}
                                data-ocid={`order.edit_button.${idx + 1}`}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit order</TooltipContent>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(order)}
                                data-ocid={`order.delete_button.${idx + 1}`}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete order</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewDetail(order)}
                              data-ocid={`order.detail.open_modal_button.${idx + 1}`}
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isSearching && Number(total) > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="order.pagination_prev"
              className="h-7 border-border text-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="order.pagination_next"
              className="h-7 border-border text-sm"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <OrderForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />
      <OrderForm
        open={!!editOrder}
        onOpenChange={(o) => !o && setEditOrder(null)}
        order={editOrder}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        orderId={deleteTarget?.id ?? null}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

// ─── Payment Tab ───────────────────────────────────────────────────────────
function PaymentTab({
  currentUser,
  onViewDetail,
}: {
  currentUser: AppUser | null | undefined;
  onViewDetail: (order: Order) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const expectedQuery = useListExpectedPayment();
  const collectTodayQuery = useListCollectToday(today);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Collect Today
        </h3>
        <OrderFilterTab
          title="Collect Today"
          orders={collectTodayQuery.data ?? []}
          isLoading={collectTodayQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={onViewDetail}
        />
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          All Expected Payments
        </h3>
        <OrderFilterTab
          title="Expected Payment"
          orders={expectedQuery.data ?? []}
          isLoading={expectedQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={onViewDetail}
        />
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
function OrderManagement() {
  const currentUserQuery = useGetCurrentUser();
  const rolesQuery = useListRoles();
  const stagesQuery = useListStages();
  const heldQuery = useListHeld();
  const allClearQuery = useListAllClear();
  const pendingQuery = useListPending();
  const markHoldMutation = useMarkHold();
  const unmarkHoldMutation = useUnmarkHold();
  const markAllClearMutation = useMarkAllClear();
  const unmarkAllClearMutation = useUnmarkAllClear();

  const [registering, setRegistering] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [holdActionPending, setHoldActionPending] = useState<bigint | null>(
    null,
  );
  const [allClearActionPending, setAllClearActionPending] = useState<
    bigint | null
  >(null);

  const currentUser = currentUserQuery.data;
  const roles = rolesQuery.data ?? [];
  const stages = stagesQuery.data ?? [];
  const isActorLoading = currentUserQuery.isLoading;

  const needsRegistration =
    !isActorLoading && currentUser === null && !registering;

  if (isActorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (needsRegistration) {
    return (
      <RegistrationGate
        onRegistered={() => {
          setRegistering(true);
          currentUserQuery.refetch().then(() => setRegistering(false));
        }}
      />
    );
  }

  const userIsAdmin = isAdmin(currentUser);
  const userIsManagerOrAdmin = isManagerOrAdmin(currentUser);

  const handleHoldAction = async (order: Order) => {
    setHoldActionPending(order.id);
    try {
      if (order.holdFlag) {
        await unmarkHoldMutation.mutateAsync(order.id);
        toast.success("Hold removed");
      } else {
        await markHoldMutation.mutateAsync(order.id);
        toast.success("Order held");
      }
    } catch {
      toast.error("Failed to update hold");
    } finally {
      setHoldActionPending(null);
    }
  };

  const handleAllClearAction = async (order: Order) => {
    setAllClearActionPending(order.id);
    try {
      if (order.allClearFlag) {
        await unmarkAllClearMutation.mutateAsync(order.id);
        toast.success("All-clear removed");
      } else {
        await markAllClearMutation.mutateAsync(order.id);
        toast.success("Order marked all-clear");
      }
    } catch {
      toast.error("Failed to update all-clear");
    } finally {
      setAllClearActionPending(null);
    }
  };

  const allTabs = (
    <Tabs defaultValue="orders" className="space-y-4">
      <TabsList
        className="bg-muted/40 border border-border h-8 flex-wrap gap-y-1"
        data-ocid="app.tab"
      >
        <TabsTrigger
          value="orders"
          data-ocid="app.orders.tab"
          className="h-7 text-sm gap-1.5"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Orders
        </TabsTrigger>
        <TabsTrigger
          value="pending"
          data-ocid="app.pending.tab"
          className="h-7 text-sm gap-1.5"
        >
          <PackageSearch className="w-3.5 h-3.5" />
          Pending
        </TabsTrigger>
        <TabsTrigger
          value="held"
          data-ocid="app.held.tab"
          className="h-7 text-sm gap-1.5"
        >
          <PauseCircle className="w-3.5 h-3.5" />
          Held
        </TabsTrigger>
        <TabsTrigger
          value="allclear"
          data-ocid="app.allclear.tab"
          className="h-7 text-sm gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          All Clear
        </TabsTrigger>
        <TabsTrigger
          value="payment"
          data-ocid="app.payment.tab"
          className="h-7 text-sm gap-1.5"
        >
          <ScrollText className="w-3.5 h-3.5" />
          Payment
        </TabsTrigger>
        {userIsAdmin && (
          <>
            <TabsTrigger
              value="stages"
              data-ocid="app.stages.tab"
              className="h-7 text-sm gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Stages
              <Shield className="w-3 h-3 text-primary" />
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              data-ocid="app.audit.tab"
              className="h-7 text-sm gap-1.5"
            >
              <ScrollText className="w-3.5 h-3.5" />
              Audit Log
              <Shield className="w-3 h-3 text-primary" />
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              data-ocid="app.settings.tab"
              className="h-7 text-sm gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
              <Shield className="w-3 h-3 text-primary" />
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="app.users.tab"
              className="h-7 text-sm gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Users
              <Shield className="w-3 h-3 text-primary" />
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="orders">
        <OrdersTab currentUser={currentUser} onViewDetail={setDetailOrder} />
      </TabsContent>

      <TabsContent value="pending">
        <OrderFilterTab
          title="Pending Orders"
          orders={pendingQuery.data ?? []}
          isLoading={pendingQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={setDetailOrder}
        />
      </TabsContent>

      <TabsContent value="held">
        <OrderFilterTab
          title="Held Orders"
          orders={heldQuery.data ?? []}
          isLoading={heldQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={setDetailOrder}
          actionLabel={userIsManagerOrAdmin ? "Toggle Hold" : undefined}
          onAction={userIsManagerOrAdmin ? handleHoldAction : undefined}
          actionPending={holdActionPending}
        />
      </TabsContent>

      <TabsContent value="allclear">
        <OrderFilterTab
          title="All Clear Orders"
          orders={allClearQuery.data ?? []}
          isLoading={allClearQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={setDetailOrder}
          actionLabel={userIsManagerOrAdmin ? "Toggle Clear" : undefined}
          onAction={userIsManagerOrAdmin ? handleAllClearAction : undefined}
          actionPending={allClearActionPending}
        />
      </TabsContent>

      <TabsContent value="payment">
        <PaymentTab currentUser={currentUser} onViewDetail={setDetailOrder} />
      </TabsContent>

      {userIsAdmin && (
        <>
          <TabsContent value="stages">
            <StagesTab
              stages={stages}
              isLoading={stagesQuery.isLoading}
              roles={roles}
            />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLogTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </>
      )}
    </Tabs>
  );

  const nonAdminView = (
    <Tabs defaultValue="orders" className="space-y-4">
      <TabsList
        className="bg-muted/40 border border-border h-8"
        data-ocid="app.tab"
      >
        <TabsTrigger
          value="orders"
          data-ocid="app.orders.tab"
          className="h-7 text-sm gap-1.5"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Orders
        </TabsTrigger>
        <TabsTrigger
          value="pending"
          data-ocid="app.pending.tab"
          className="h-7 text-sm gap-1.5"
        >
          <PackageSearch className="w-3.5 h-3.5" />
          Pending
        </TabsTrigger>
        <TabsTrigger
          value="held"
          data-ocid="app.held.tab"
          className="h-7 text-sm gap-1.5"
        >
          <PauseCircle className="w-3.5 h-3.5" />
          Held
        </TabsTrigger>
        <TabsTrigger
          value="allclear"
          data-ocid="app.allclear.tab"
          className="h-7 text-sm gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          All Clear
        </TabsTrigger>
        <TabsTrigger
          value="payment"
          data-ocid="app.payment.tab"
          className="h-7 text-sm gap-1.5"
        >
          <ScrollText className="w-3.5 h-3.5" />
          Payment
        </TabsTrigger>
      </TabsList>
      <TabsContent value="orders">
        <OrdersTab currentUser={currentUser} onViewDetail={setDetailOrder} />
      </TabsContent>
      <TabsContent value="pending">
        <OrderFilterTab
          title="Pending Orders"
          orders={pendingQuery.data ?? []}
          isLoading={pendingQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={setDetailOrder}
        />
      </TabsContent>
      <TabsContent value="held">
        <OrderFilterTab
          title="Held Orders"
          orders={heldQuery.data ?? []}
          isLoading={heldQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={setDetailOrder}
        />
      </TabsContent>
      <TabsContent value="allclear">
        <OrderFilterTab
          title="All Clear Orders"
          orders={allClearQuery.data ?? []}
          isLoading={allClearQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={setDetailOrder}
        />
      </TabsContent>
      <TabsContent value="payment">
        <PaymentTab currentUser={currentUser} onViewDetail={setDetailOrder} />
      </TabsContent>
    </Tabs>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card grid-texture">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                  Order Management
                </h1>
                <p className="text-xs text-muted-foreground">
                  Track and manage all orders
                </p>
              </div>
            </div>
            {currentUser && <UserChip user={currentUser} roles={roles} />}
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6">
          {userIsAdmin ? allTabs : nonAdminView}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        currentUser={currentUser}
        roles={roles}
        stages={stages}
      />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrderManagement />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-sans",
          },
        }}
      />
    </QueryClientProvider>
  );
}
