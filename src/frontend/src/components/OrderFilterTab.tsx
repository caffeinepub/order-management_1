import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Eye,
  Loader2,
  PackageSearch,
  PauseCircle,
} from "lucide-react";
import type { AppUser, Order } from "../backend.d";

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

interface OrderFilterTabProps {
  title: string;
  orders: Order[];
  isLoading: boolean;
  currentUser: AppUser | null | undefined;
  onViewDetail: (order: Order) => void;
  actionLabel?: string;
  onAction?: (order: Order) => void;
  actionPending?: bigint | null;
}

const SKELETON_COLS = [1, 2, 3, 4, 5, 6, 7];

export function OrderFilterTab({
  title,
  orders,
  isLoading,
  onViewDetail,
  actionLabel,
  onAction,
  actionPending,
}: OrderFilterTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          {title}
          <span className="ml-2 text-muted-foreground font-normal">
            ({orders.length})
          </span>
        </h2>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <Table>
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
                Status
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Pay Date
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Flags
              </TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-border">
                  {SKELETON_COLS.map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-muted/40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={7}
                  className="py-12 text-center"
                  data-ocid="filter.empty_state"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <PackageSearch className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No orders</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, idx) => (
                <TableRow
                  key={order.id.toString()}
                  className="border-border hover:bg-muted/20"
                  data-ocid={`filter.row.item.${idx + 1}`}
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
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.expectedDelivery || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {order.isHeld && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PauseCircle className="w-3.5 h-3.5 text-yellow-400" />
                          </TooltipTrigger>
                          <TooltipContent>On hold</TooltipContent>
                        </Tooltip>
                      )}
                      {order.isAllClear && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          </TooltipTrigger>
                          <TooltipContent>All clear</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetail(order)}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                      {actionLabel && onAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAction(order)}
                          disabled={actionPending === order.id}
                          className="h-6 text-xs px-2 border-border"
                        >
                          {actionPending === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            actionLabel
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
