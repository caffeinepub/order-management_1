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
  Lock,
  LogOut,
  PackageSearch,
  PauseCircle,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
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
import { AuthContext, useAuth, useAuthProvider } from "./hooks/useAuth";
import {
  useCreateOrder,
  useDeleteOrder,
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
  return !!user?.roles.includes(1n);
}

function isManagerOrAdmin(user: AppUser | null | undefined): boolean {
  return !!user?.roles.some((id) => id === 1n || id === 2n);
}

function getRoleNames(roleIds: bigint[], roles: AppRole[]): string[] {
  return roleIds.map(
    (rid) => roles.find((r) => r.id === rid)?.name ?? `Role ${rid}`,
  );
}

// ─── Login Page ────────────────────────────────────────────────────────────
function LoginPage({
  onLoggedIn,
}: {
  onLoggedIn: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { login, register, isLoading } = useAuth();

  // Also show public search
  const [publicSearch, setPublicSearch] = useState("");
  const [publicSearchInput, setPublicSearchInput] = useState("");
  const [publicDetailOrder, setPublicDetailOrder] = useState<Order | null>(
    null,
  );
  const searchQuery = useSearchOrders(publicSearch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 4) {
        setError("Password must be at least 4 characters");
        return;
      }
    }
    try {
      if (mode === "login") {
        await login(username.trim(), password);
        toast.success("Welcome back!");
      } else {
        await register(username.trim(), password);
        toast.success("Account created! Welcome.");
      }
      onLoggedIn();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    }
  };

  const handlePublicSearch = () => {
    setPublicSearch(publicSearchInput.trim());
  };

  const isSearching = publicSearch.length > 0;
  const searchResults = searchQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
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
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-sm"
            data-ocid="login.open_modal_button"
            onClick={() =>
              document
                .getElementById("staff-login-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Lock className="w-3.5 h-3.5" />
            Staff Login
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Public Order Search (left, wider) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Track Your Order
              </h2>
              <p className="text-sm text-muted-foreground">
                Search by Order ID, Consumer No, or Contact No — no login
                required.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="public.search_input"
                  value={publicSearchInput}
                  onChange={(e) => setPublicSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePublicSearch()}
                  placeholder="Order ID, Consumer No, or Contact No..."
                  className="pl-10 bg-input border-border"
                />
              </div>
              <Button
                onClick={handlePublicSearch}
                data-ocid="public.search.button"
                className="bg-primary text-primary-foreground"
              >
                Search
              </Button>
              {isSearching && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPublicSearch("");
                    setPublicSearchInput("");
                  }}
                  data-ocid="public.search.cancel_button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="space-y-3">
                {searchQuery.isLoading ? (
                  <div
                    data-ocid="public.search.loading_state"
                    className="space-y-2"
                  >
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-sm" />
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div
                    data-ocid="public.search.empty_state"
                    className="text-center py-12 text-muted-foreground"
                  >
                    <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      No orders found for &ldquo;{publicSearch}&rdquo;
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {searchResults.length} result
                      {searchResults.length !== 1 ? "s" : ""} found
                    </p>
                    <div className="border border-border rounded-sm overflow-hidden">
                      <Table data-ocid="public.search.table">
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-border">
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                              Order ID
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                              Consumer No
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                              Customer
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((order, idx) => (
                            <TableRow
                              key={order.id.toString()}
                              data-ocid={`public.search.item.${idx + 1}`}
                              className="border-border hover:bg-muted/20 cursor-pointer"
                              onClick={() => setPublicDetailOrder(order)}
                            >
                              <TableCell className="text-sm font-mono">
                                {order.orderId}
                              </TableCell>
                              <TableCell className="text-sm">
                                {order.consumerNo}
                              </TableCell>
                              <TableCell className="text-sm">
                                {order.customerName}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-sm border font-medium ${getStatusClass(order.status)}`}
                                >
                                  {order.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  data-ocid={`public.search.view.button.${idx + 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPublicDetailOrder(order);
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isSearching && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {["Order ID", "Consumer No", "Contact No"].map((label) => (
                  <div
                    key={label}
                    className="bg-card border border-border rounded-sm p-4 text-center"
                  >
                    <Search className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Search by</p>
                    <p className="text-sm font-semibold text-foreground">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff Login (right) */}
          <div id="staff-login-section" className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-card border border-border rounded-sm p-6 space-y-5"
              data-ocid="login.panel"
            >
              <div className="text-center">
                <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center mx-auto mb-3">
                  {mode === "login" ? (
                    <Lock className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-primary-foreground" />
                  )}
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  {mode === "login" ? "Staff Login" : "Create Account"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "login"
                    ? "Sign in to access the full dashboard"
                    : "Register for staff access"}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                data-ocid="login.dialog"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-username"
                    className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                  >
                    Username
                  </label>
                  <Input
                    id="auth-username"
                    data-ocid="login.input"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    required
                    placeholder="Enter username"
                    className="bg-input border-border h-9 text-sm"
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-password"
                    className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                  >
                    Password
                  </label>
                  <Input
                    id="auth-password"
                    data-ocid="login.input"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    placeholder="Enter password"
                    className="bg-input border-border h-9 text-sm"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-confirm"
                      className="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                    >
                      Confirm Password
                    </label>
                    <Input
                      id="auth-confirm"
                      data-ocid="register.input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      required
                      placeholder="Confirm password"
                      className="bg-input border-border h-9 text-sm"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {error && (
                  <p
                    data-ocid="login.error_state"
                    className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password}
                  data-ocid="login.submit_button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {isLoading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </Button>
              </form>

              <div className="text-center pt-1 border-t border-border">
                {mode === "login" ? (
                  <p className="text-xs text-muted-foreground">
                    No account?{" "}
                    <button
                      type="button"
                      data-ocid="login.register.link"
                      onClick={() => {
                        setMode("register");
                        setError("");
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Register here
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      data-ocid="register.login.link"
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

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

      {/* Public order detail drawer */}
      <OrderDetailDrawer
        order={publicDetailOrder}
        onClose={() => setPublicDetailOrder(null)}
        currentUser={null}
        roles={[]}
        stages={[]}
      />
    </div>
  );
}

// ─── User Chip ─────────────────────────────────────────────────────────────
function UserChip({
  user,
  roles,
  onLogout,
}: {
  user: AppUser;
  roles: AppRole[];
  onLogout: () => void;
}) {
  const roleNames = getRoleNames(user.roles, roles);
  return (
    <div className="flex items-center gap-3">
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            data-ocid="app.logout.button"
            onClick={onLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Sign out</TooltipContent>
      </Tooltip>
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
      const id = await createMutation.mutateAsync({
        orderId: data.orderId,
        consumerNo: data.consumerNo,
        contactNo: data.contactNo,
        customerName: data.customerName,
        address: data.address,
        orderDate: data.orderDate,
        expectedDelivery: data.expectedDelivery,
        product: data.product,
        quantity: BigInt(data.quantityText || "1"),
        amount: Number.parseFloat(data.amountText || "0"),
      });
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
        orderId: data.orderId,
        consumerNo: data.consumerNo,
        contactNo: data.contactNo,
        customerName: data.customerName,
        address: data.address,
        orderDate: data.orderDate,
        expectedDelivery: data.expectedDelivery,
        product: data.product,
        quantity: BigInt(data.quantityText || "1"),
        amount: Number.parseFloat(data.amountText || "0"),
        status: data.status || editOrder.status,
        paymentStatus: data.paymentStatus || editOrder.paymentStatus,
        paymentDate: data.paymentDate || editOrder.paymentDate,
        collectDate: data.collectDate || editOrder.collectDate,
        notes: data.notes || editOrder.notes,
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
        value: !order.isHeld,
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
        value: !order.isAllClear,
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
              SKELETON_ROWS.map((key) => (
                <TableRow key={key} className="border-border">
                  {SKELETON_COLS.map((k) => (
                    <TableCell key={k}>
                      <Skeleton className="h-4 w-full rounded-sm" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="order.empty_state"
                >
                  <PackageSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {isSearching
                      ? `No orders found for "${search}"`
                      : "No orders yet. Create your first order."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, idx) => (
                <TableRow
                  key={order.id.toString()}
                  data-ocid={`order.item.${idx + 1}`}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {order.id.toString()}
                  </TableCell>
                  <TableCell className="text-sm">{order.consumerNo}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {order.customerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.contactNo}
                  </TableCell>
                  <TableCell className="text-sm">{order.product}</TableCell>
                  <TableCell className="text-sm text-right font-mono">
                    {order.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-sm border font-medium ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.paymentDate || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      {order.isHeld && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-yellow-400">
                              <PauseCircle className="w-3.5 h-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>On Hold</TooltipContent>
                        </Tooltip>
                      )}
                      {order.isAllClear && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-green-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>All Clear</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            data-ocid={`order.view.button.${idx + 1}`}
                            onClick={() => onViewDetail(order)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              data-ocid={`order.edit_button.${idx + 1}`}
                              onClick={() => setEditOrder(order)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 ${
                                order.isHeld
                                  ? "text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                              data-ocid={`order.hold.toggle.${idx + 1}`}
                              onClick={() => handleToggleHold(order)}
                              disabled={holdPending === order.id}
                            >
                              {holdPending === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <PauseCircle className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {order.isHeld ? "Remove Hold" : "Put on Hold"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isAdmin(currentUser) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 ${
                                order.isAllClear
                                  ? "text-green-400"
                                  : "text-muted-foreground"
                              }`}
                              data-ocid={`order.allclear.toggle.${idx + 1}`}
                              onClick={() => handleToggleAllClear(order)}
                              disabled={allClearPending === order.id}
                            >
                              {allClearPending === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {order.isAllClear
                              ? "Remove All-Clear"
                              : "Mark All-Clear"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive"
                              data-ocid={`order.delete_button.${idx + 1}`}
                              onClick={() => setDeleteTarget(order)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isSearching && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-sm"
              data-ocid="order.pagination_prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-sm"
              data-ocid="order.pagination_next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <OrderForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <OrderForm
        open={!!editOrder}
        onOpenChange={(o) => {
          if (!o) setEditOrder(null);
        }}
        order={editOrder}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
      />

      {/* Delete Confirm */}
      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
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
  const collectTodayQuery = useListCollectToday(today);
  const expectedQuery = useListExpectedPayment();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Collect Today ({today})
        </h3>
        <OrderFilterTab
          title=""
          orders={collectTodayQuery.data ?? []}
          isLoading={collectTodayQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={onViewDetail}
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          All Expected Payments
        </h3>
        <OrderFilterTab
          title=""
          orders={expectedQuery.data ?? []}
          isLoading={expectedQuery.isLoading}
          currentUser={currentUser}
          onViewDetail={onViewDetail}
        />
      </div>
    </div>
  );
}

// ─── Order Management (main authenticated view) ────────────────────────────
function OrderManagement() {
  const { currentUser, logout } = useAuth();
  const rolesQuery = useListRoles();
  const stagesQuery = useListStages();
  const heldQuery = useListHeld();
  const allClearQuery = useListAllClear();
  const pendingQuery = useListPending();
  const markHoldMutation = useMarkHold();
  const unmarkHoldMutation = useUnmarkHold();
  const markAllClearMutation = useMarkAllClear();
  const unmarkAllClearMutation = useUnmarkAllClear();

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [holdActionPending, setHoldActionPending] = useState<bigint | null>(
    null,
  );
  const [allClearActionPending, setAllClearActionPending] = useState<
    bigint | null
  >(null);

  const roles = rolesQuery.data ?? [];
  const stages = stagesQuery.data ?? [];

  const userIsAdmin = isAdmin(currentUser);
  const userIsManagerOrAdmin = isManagerOrAdmin(currentUser);

  const handleHoldAction = async (order: Order) => {
    setHoldActionPending(order.id);
    try {
      if (order.isHeld) {
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
      if (order.isAllClear) {
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
            {currentUser && (
              <UserChip user={currentUser} roles={roles} onLogout={logout} />
            )}
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

// ─── Root ──────────────────────────────────────────────────────────────────
function AppRoot() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoggedIn={() => {}} />;
  }

  return <OrderManagement />;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoot />
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "bg-card border-border text-foreground font-sans",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
