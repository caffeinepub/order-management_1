import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Archive,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { AppRole, AppUser, Order, Stage } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useListRoles } from "../hooks/useQueries";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatOrder(order: Order) {
  return {
    ID: Number(order.id),
    "Order ID": order.orderId,
    "Consumer No": order.consumerNo,
    "Contact No": order.contactNo,
    "Customer Name": order.customerName,
    Address: order.address,
    Product: order.product,
    Quantity: Number(order.quantity),
    Amount: order.amount,
    Status: order.status,
    "Payment Status": order.paymentStatus,
    "Order Date": order.orderDate,
    "Expected Delivery": order.expectedDelivery,
    "Collect Date": order.collectDate,
    "Payment Date": order.paymentDate,
    Notes: order.notes,
    Held: order.isHeld ? "Yes" : "No",
    "All Clear": order.isAllClear ? "Yes" : "No",
  };
}

function formatUser(user: AppUser, roles: AppRole[]) {
  const roleNames = user.roles.map(
    (rid) => roles.find((r) => r.id === rid)?.name ?? `Role ${rid}`,
  );
  return {
    ID: Number(user.id),
    Username: user.username,
    Roles: roleNames.join(", "),
  };
}

function formatStage(stage: Stage, roles: AppRole[]) {
  const roleNames = stage.assignedRoles.map(
    (rid) => roles.find((r) => r.id === rid)?.name ?? `Role ${rid}`,
  );
  return {
    ID: Number(stage.id),
    Name: stage.name,
    Order: Number(stage.orderIndex),
    "Assigned Roles": roleNames.join(", "),
    "SFA Enabled": stage.sfaEnabled ? "Yes" : "No",
  };
}

async function fetchAllOrders(actor: any): Promise<Order[]> {
  const PAGE = 100n;
  let page = 0n;
  const all: Order[] = [];
  while (true) {
    const res = await actor.listOrders(page, PAGE);
    all.push(...res.orders);
    if (all.length >= Number(res.total)) break;
    page++;
  }
  return all;
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

// ─── Export Dropdown (header) ──────────────────────────────────────────────

export function ExportDropdown({
  currentUser,
  stages,
  roles,
}: {
  currentUser: AppUser | null | undefined;
  stages: Stage[];
  roles: AppRole[];
}) {
  const { actor } = useActor();
  const [loading, setLoading] = useState(false);

  const isAdmin = !!currentUser?.roles.includes(1n);

  const handleExportOrders = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const orders = await fetchAllOrders(actor);
      const ws = XLSX.utils.json_to_sheet(orders.map((o) => formatOrder(o)));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      downloadWorkbook(
        wb,
        `orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success(`Exported ${orders.length} orders`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const allUsers = await actor.listUsers();
      const ws = XLSX.utils.json_to_sheet(
        allUsers.map((u: AppUser) => formatUser(u, roles)),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      downloadWorkbook(
        wb,
        `users-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success(`Exported ${allUsers.length} users`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportStages = async () => {
    setLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(
        stages.map((s) => formatStage(s, roles)),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stages");
      downloadWorkbook(
        wb,
        `stages-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success(`Exported ${stages.length} stages`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFullBackup = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [orders, allUsers, allRoles] = await Promise.all([
        fetchAllOrders(actor),
        actor.listUsers(),
        actor.listRoles(),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(orders.map((o) => formatOrder(o))),
        "Orders",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          (allUsers as AppUser[]).map((u: AppUser) => formatUser(u, roles)),
        ),
        "Users",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(stages.map((s) => formatStage(s, roles))),
        "Stages",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          (allRoles as AppRole[]).map((r: AppRole) => ({
            ID: Number(r.id),
            Name: r.name,
            Description: r.description,
          })),
        ),
        "Roles",
      );
      downloadWorkbook(
        wb,
        `backup-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success("Full backup downloaded");
    } catch {
      toast.error("Backup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-sm gap-1.5"
          disabled={loading}
          data-ocid="export.dropdown_menu"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Export
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={handleExportOrders}
          data-ocid="export.orders.button"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
          Export Orders
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem
              onClick={handleExportUsers}
              data-ocid="export.users.button"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
              Export Users
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportStages}
              data-ocid="export.stages.button"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
              Export Stage Config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleFullBackup}
              data-ocid="export.backup.button"
            >
              <Archive className="w-3.5 h-3.5 mr-2" />
              Full Backup
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Import Orders Dialog ──────────────────────────────────────────────────

interface ParsedOrder {
  orderId: string;
  consumerNo: string;
  contactNo: string;
  customerName: string;
  address: string;
  orderDate: string;
  expectedDelivery: string;
  product: string;
  quantity: bigint;
  amount: number;
}

function downloadOrderTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      "Order ID": "ORD-001",
      "Consumer No": "CON-001",
      "Contact No": "9876543210",
      "Customer Name": "John Doe",
      Address: "123 Main St",
      "Order Date": "2026-01-01",
      "Expected Delivery": "2026-01-15",
      Product: "Solar Panel",
      Quantity: 2,
      Amount: 50000,
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, "orders-template.xlsx");
}

export function ImportOrdersButton({
  canImport,
}: {
  canImport: boolean;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedOrder[]>([]);
  const [skipped, setSkipped] = useState<{ row: number; reason: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ success: number; errors: number } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  if (!canImport) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const valid: ParsedOrder[] = [];
        const skip: { row: number; reason: string }[] = [];

        rows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const orderId = String(row["Order ID"] ?? "").trim();
          const consumerNo = String(row["Consumer No"] ?? "").trim();
          const contactNo = String(row["Contact No"] ?? "").trim();
          const customerName = String(row["Customer Name"] ?? "").trim();

          if (!orderId) {
            skip.push({ row: rowNum, reason: "Missing Order ID" });
            return;
          }
          if (!consumerNo) {
            skip.push({ row: rowNum, reason: "Missing Consumer No" });
            return;
          }
          if (!contactNo) {
            skip.push({ row: rowNum, reason: "Missing Contact No" });
            return;
          }
          if (!customerName) {
            skip.push({ row: rowNum, reason: "Missing Customer Name" });
            return;
          }

          valid.push({
            orderId,
            consumerNo,
            contactNo,
            customerName,
            address: String(row.Address ?? ""),
            orderDate: String(row["Order Date"] ?? ""),
            expectedDelivery: String(row["Expected Delivery"] ?? ""),
            product: String(row.Product ?? ""),
            quantity: BigInt(Number(row.Quantity ?? 1)),
            amount: Number(row.Amount ?? 0),
          });
        });

        setParsed(valid);
        setSkipped(skip);
        setDone(null);
        setProgress(0);
      } catch {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!actor || parsed.length === 0) return;
    setImporting(true);
    let success = 0;
    let errors = 0;
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      try {
        await actor.createOrder(
          row.orderId,
          row.consumerNo,
          row.contactNo,
          row.customerName,
          row.address,
          row.orderDate,
          row.expectedDelivery,
          row.product,
          row.quantity,
          row.amount,
        );
        success++;
      } catch {
        errors++;
      }
      setProgress(Math.round(((i + 1) / parsed.length) * 100));
    }
    setDone({ success, errors });
    setImporting(false);
    if (success > 0) toast.success(`Imported ${success} orders`);
    if (errors > 0) toast.error(`${errors} rows failed`);
  };

  const handleClose = () => {
    setOpen(false);
    setParsed([]);
    setSkipped([]);
    setProgress(0);
    setDone(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-sm gap-1.5"
        onClick={() => setOpen(true)}
        data-ocid="import.orders.open_modal_button"
      >
        <Upload className="w-3.5 h-3.5" />
        Import
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-2xl" data-ocid="import.orders.dialog">
          <DialogHeader>
            <DialogTitle>Import Orders from Excel</DialogTitle>
          </DialogHeader>

          {/* File drop zone */}
          {parsed.length === 0 && !done && (
            <div
              className="border-2 border-dashed border-border rounded-sm p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              data-ocid="import.orders.dropzone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">
                Drop an Excel file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                .xlsx or .xls files only
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                data-ocid="import.orders.upload_button"
              />
            </div>
          )}

          {/* Preview */}
          {parsed.length > 0 && !done && (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">
                  {parsed.length}
                </span>{" "}
                valid rows ready to import
                {skipped.length > 0 && (
                  <span className="text-destructive ml-2">
                    · {skipped.length} skipped
                  </span>
                )}
              </p>

              <div className="border border-border rounded-sm overflow-hidden max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-border">
                      <TableHead className="text-xs">Order ID</TableHead>
                      <TableHead className="text-xs">Consumer No</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs text-right">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.slice(0, 20).map((row, i) => (
                      <TableRow
                        key={`${row.orderId}-${i}`}
                        className="border-border text-xs"
                        data-ocid={`import.orders.item.${i + 1}`}
                      >
                        <TableCell className="font-mono">
                          {row.orderId}
                        </TableCell>
                        <TableCell>{row.consumerNo}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell className="text-right">
                          {row.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {skipped.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-3">
                  <p className="text-xs font-semibold text-destructive mb-1">
                    Skipped rows:
                  </p>
                  {skipped.slice(0, 5).map((s, i) => (
                    <p
                      key={`skip-${s.row}-${i}`}
                      className="text-xs text-muted-foreground"
                    >
                      Row {s.row}: {s.reason}
                    </p>
                  ))}
                  {skipped.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      …and {skipped.length - 5} more
                    </p>
                  )}
                </div>
              )}

              {importing && (
                <div
                  className="space-y-1"
                  data-ocid="import.orders.loading_state"
                >
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Done */}
          {done && (
            <div
              className="text-center py-6"
              data-ocid="import.orders.success_state"
            >
              <p className="text-sm font-semibold text-foreground">
                ✅ Import complete: {done.success} succeeded
                {done.errors > 0 ? `, ${done.errors} failed` : ""}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadOrderTemplate}
              data-ocid="import.orders.template.button"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Template
            </Button>
            {parsed.length > 0 && !done && (
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing}
                data-ocid="import.orders.submit_button"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Import {parsed.length} Rows
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-ocid="import.orders.close_button"
            >
              {done ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Import Users (role assignment) ───────────────────────────────────────

function downloadUsersTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    { Username: "john", Roles: "Seller, BO" },
    { Username: "jane", Roles: "Manager" },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  XLSX.writeFile(wb, "users-roles-template.xlsx");
}

export function ImportUsersButton({
  isAdmin,
  users,
  roles,
  onDone,
}: {
  isAdmin: boolean;
  users: AppUser[];
  roles: AppRole[];
  onDone: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<
    { username: string; roleNames: string[]; userId?: bigint }[]
  >([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{
    matched: number;
    unmatched: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        const parsed = rawRows
          .map((row) => {
            const username = String(row.Username ?? "").trim();
            const roleStr = String(row.Roles ?? "");
            const roleNames = roleStr
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean);
            const user = users.find(
              (u) => u.username.toLowerCase() === username.toLowerCase(),
            );
            return { username, roleNames, userId: user?.id };
          })
          .filter((r) => r.username);
        setRows(parsed);
        setDone(null);
        setProgress(0);
      } catch {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!actor || rows.length === 0) return;
    setImporting(true);
    let matched = 0;
    let unmatched = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.userId) {
        unmatched++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }
      const roleIds = row.roleNames
        .map(
          (name) =>
            roles.find((r) => r.name.toLowerCase() === name.toLowerCase())?.id,
        )
        .filter((id): id is bigint => id !== undefined);
      try {
        await actor.assignRoles(row.userId, roleIds);
        matched++;
      } catch {
        unmatched++;
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    setDone({ matched, unmatched });
    setImporting(false);
    onDone();
    toast.success(`Roles assigned for ${matched} users`);
  };

  const handleClose = () => {
    setOpen(false);
    setRows([]);
    setProgress(0);
    setDone(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-sm gap-1.5"
        onClick={() => setOpen(true)}
        data-ocid="import.users.open_modal_button"
      >
        <Upload className="w-3.5 h-3.5" />
        Import Roles
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg" data-ocid="import.users.dialog">
          <DialogHeader>
            <DialogTitle>Import User Roles from Excel</DialogTitle>
          </DialogHeader>

          {rows.length === 0 && !done && (
            <div
              className="border-2 border-dashed border-border rounded-sm p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              data-ocid="import.users.dropzone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">
                Drop Excel file or click to browse
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                data-ocid="import.users.upload_button"
              />
            </div>
          )}

          {rows.length > 0 && !done && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">
                  {rows.filter((r) => r.userId).length}
                </span>{" "}
                matched users ·{" "}
                <span className="text-destructive">
                  {rows.filter((r) => !r.userId).length}
                </span>{" "}
                unmatched
              </p>
              <div className="border border-border rounded-sm overflow-hidden max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs">Username</TableHead>
                      <TableHead className="text-xs">Roles</TableHead>
                      <TableHead className="text-xs">Match</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow
                        key={`${row.username}-${i}`}
                        className="text-xs border-border"
                        data-ocid={`import.users.item.${i + 1}`}
                      >
                        <TableCell>{row.username}</TableCell>
                        <TableCell>{row.roleNames.join(", ")}</TableCell>
                        <TableCell>{row.userId ? "✅" : "❌"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importing && (
                <div data-ocid="import.users.loading_state">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right mt-0.5">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {done && (
            <div
              className="text-center py-6"
              data-ocid="import.users.success_state"
            >
              <p className="text-sm font-semibold text-foreground">
                ✅ Done: {done.matched} assigned
                {done.unmatched > 0 ? `, ${done.unmatched} unmatched` : ""}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadUsersTemplate}
              data-ocid="import.users.template.button"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Template
            </Button>
            {rows.length > 0 && !done && (
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing}
                data-ocid="import.users.submit_button"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Assign Roles
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-ocid="import.users.close_button"
            >
              {done ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Import Stages ─────────────────────────────────────────────────────────

function downloadStagesTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      Name: "Site Survey",
      Order: 1,
      "Assigned Roles": "Tech, Installer",
      "SFA Enabled": "No",
    },
    {
      Name: "Material Delivery",
      Order: 2,
      "Assigned Roles": "Installer",
      "SFA Enabled": "No",
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stages");
  XLSX.writeFile(wb, "stages-template.xlsx");
}

export function ImportStagesButton({
  isAdmin: isAdminProp,
  roles,
  onDone,
}: {
  isAdmin: boolean;
  roles: AppRole[];
  onDone: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<
    {
      name: string;
      orderIndex: bigint;
      assignedRoles: bigint[];
      sfaEnabled: boolean;
      valid: boolean;
    }[]
  >([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ success: number; errors: number } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdminProp) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        const parsed = rawRows.map((row) => {
          const name = String(row.Name ?? "").trim();
          const orderIndex = BigInt(Number(row.Order ?? 1));
          const roleStr = String(row["Assigned Roles"] ?? "");
          const assignedRoles = roleStr
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
            .map(
              (rName) =>
                roles.find((r) => r.name.toLowerCase() === rName.toLowerCase())
                  ?.id,
            )
            .filter((id): id is bigint => id !== undefined);
          const sfaEnabled =
            String(row["SFA Enabled"] ?? "").toLowerCase() === "yes";
          return { name, orderIndex, assignedRoles, sfaEnabled, valid: !!name };
        });
        setRows(parsed);
        setDone(null);
        setProgress(0);
      } catch {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!actor || rows.length === 0) return;
    setImporting(true);
    let success = 0;
    let errors = 0;
    const validRows = rows.filter((r) => r.valid);
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await actor.createStage(
          row.name,
          row.orderIndex,
          row.assignedRoles,
          row.sfaEnabled,
        );
        success++;
      } catch {
        errors++;
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }
    setDone({ success, errors });
    setImporting(false);
    onDone();
    toast.success(`Created ${success} stages`);
  };

  const handleClose = () => {
    setOpen(false);
    setRows([]);
    setProgress(0);
    setDone(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-sm gap-1.5"
        onClick={() => setOpen(true)}
        data-ocid="import.stages.open_modal_button"
      >
        <Upload className="w-3.5 h-3.5" />
        Import Stages
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg" data-ocid="import.stages.dialog">
          <DialogHeader>
            <DialogTitle>Import Stages from Excel</DialogTitle>
          </DialogHeader>

          {rows.length === 0 && !done && (
            <div
              className="border-2 border-dashed border-border rounded-sm p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              data-ocid="import.stages.dropzone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">
                Drop Excel file or click to browse
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                data-ocid="import.stages.upload_button"
              />
            </div>
          )}

          {rows.length > 0 && !done && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">
                  {rows.filter((r) => r.valid).length}
                </span>{" "}
                valid stages
              </p>
              <div className="border border-border rounded-sm overflow-hidden max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Order</TableHead>
                      <TableHead className="text-xs">Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow
                        key={`${row.name}-${i}`}
                        className="text-xs border-border"
                        data-ocid={`import.stages.item.${i + 1}`}
                      >
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{Number(row.orderIndex)}</TableCell>
                        <TableCell>
                          {row.assignedRoles
                            .map(
                              (rid) =>
                                roles.find((r) => r.id === rid)?.name ??
                                String(rid),
                            )
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importing && (
                <div data-ocid="import.stages.loading_state">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right mt-0.5">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {done && (
            <div
              className="text-center py-6"
              data-ocid="import.stages.success_state"
            >
              <p className="text-sm font-semibold text-foreground">
                ✅ Done: {done.success} created
                {done.errors > 0 ? `, ${done.errors} failed` : ""}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadStagesTemplate}
              data-ocid="import.stages.template.button"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Template
            </Button>
            {rows.length > 0 && !done && (
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing}
                data-ocid="import.stages.submit_button"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Import {rows.filter((r) => r.valid).length} Stages
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-ocid="import.stages.close_button"
            >
              {done ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Backup/Restore in Settings ────────────────────────────────────────────

export function BackupRestoreSection({
  isAdmin: isAdminProp,
  stages,
  roles,
  onRestoreDone,
}: {
  isAdmin: boolean;
  stages: Stage[];
  roles: AppRole[];
  onRestoreDone: () => void;
}) {
  const { actor } = useActor();
  const rolesQuery = useListRoles();
  const allRoles = rolesQuery.data ?? roles;
  const [restoring, setRestoring] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isAdminProp) return null;

  const handleDownloadBackup = async () => {
    if (!actor) return;
    setDownloading(true);
    try {
      const [orders, allUsers] = await Promise.all([
        fetchAllOrders(actor),
        actor.listUsers(),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(orders.map((o) => formatOrder(o))),
        "Orders",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          (allUsers as AppUser[]).map((u: AppUser) => formatUser(u, allRoles)),
        ),
        "Users",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(stages.map((s) => formatStage(s, allRoles))),
        "Stages",
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          allRoles.map((r) => ({
            ID: Number(r.id),
            Name: r.name,
            Description: r.description,
          })),
        ),
        "Roles",
      );
      downloadWorkbook(
        wb,
        `backup-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success("Full backup downloaded");
    } catch {
      toast.error("Backup failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleRestoreFile = async (file: File) => {
    if (!actor) return;
    setRestoring(true);
    setRestoreSummary(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(data), { type: "array" });

      let orderCount = 0;
      let stageCount = 0;
      let userRoleCount = 0;

      // Restore orders
      if (wb.SheetNames.includes("Orders")) {
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
          wb.Sheets.Orders,
        );
        for (const row of rows) {
          try {
            await actor.createOrder(
              String(row["Order ID"] ?? ""),
              String(row["Consumer No"] ?? ""),
              String(row["Contact No"] ?? ""),
              String(row["Customer Name"] ?? ""),
              String(row.Address ?? ""),
              String(row["Order Date"] ?? ""),
              String(row["Expected Delivery"] ?? ""),
              String(row.Product ?? ""),
              BigInt(Number(row.Quantity ?? 1)),
              Number(row.Amount ?? 0),
            );
            orderCount++;
          } catch {
            /* skip duplicates */
          }
        }
      }

      // Restore stages
      if (wb.SheetNames.includes("Stages")) {
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
          wb.Sheets.Stages,
        );
        for (const row of rows) {
          try {
            const roleNames = String(row["Assigned Roles"] ?? "")
              .split(",")
              .map((r: string) => r.trim());
            const roleIds = roleNames
              .map(
                (n: string) =>
                  allRoles.find((r) => r.name.toLowerCase() === n.toLowerCase())
                    ?.id,
              )
              .filter((id): id is bigint => id !== undefined);
            await actor.createStage(
              String(row.Name ?? ""),
              BigInt(Number(row.Order ?? 1)),
              roleIds,
              String(row["SFA Enabled"] ?? "").toLowerCase() === "yes",
            );
            stageCount++;
          } catch {
            /* skip */
          }
        }
      }

      // Restore user roles
      if (wb.SheetNames.includes("Users")) {
        const allUsers: AppUser[] = await actor.listUsers();
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
          wb.Sheets.Users,
        );
        for (const row of rows) {
          try {
            const username = String(row.Username ?? "").trim();
            const user = allUsers.find(
              (u) => u.username.toLowerCase() === username.toLowerCase(),
            );
            if (!user) continue;
            const roleNames = String(row.Roles ?? "")
              .split(",")
              .map((r: string) => r.trim());
            const roleIds = roleNames
              .map(
                (n: string) =>
                  allRoles.find((r) => r.name.toLowerCase() === n.toLowerCase())
                    ?.id,
              )
              .filter((id): id is bigint => id !== undefined);
            await actor.assignRoles(user.id, roleIds);
            userRoleCount++;
          } catch {
            /* skip */
          }
        }
      }

      setRestoreSummary(
        `Restored: ${orderCount} orders, ${stageCount} stages, ${userRoleCount} user roles`,
      );
      toast.success("Restore complete");
      onRestoreDone();
    } catch {
      toast.error("Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="border border-border rounded-sm p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Archive className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Backup &amp; Restore
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Download a full system backup or restore from a previously exported
        backup file.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-sm gap-1.5"
          onClick={handleDownloadBackup}
          disabled={downloading}
          data-ocid="settings.backup.button"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Download Full Backup
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-sm gap-1.5"
          onClick={() => fileRef.current?.click()}
          disabled={restoring}
          data-ocid="settings.restore.upload_button"
        >
          {restoring ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Restore from Backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleRestoreFile(f);
          }}
        />
      </div>
      {restoreSummary && (
        <p
          className="text-xs text-green-400"
          data-ocid="settings.restore.success_state"
        >
          ✅ {restoreSummary}
        </p>
      )}
      {restoring && (
        <p
          className="text-xs text-muted-foreground animate-pulse"
          data-ocid="settings.restore.loading_state"
        >
          Restoring data…
        </p>
      )}
    </div>
  );
}
