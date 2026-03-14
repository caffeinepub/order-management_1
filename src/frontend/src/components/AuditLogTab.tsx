import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import { useListAuditLog } from "../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  try {
    return new Date(Number(ts / 1_000_000n)).toLocaleString();
  } catch {
    return ts.toString();
  }
}

export function AuditLogTab() {
  const auditQuery = useListAuditLog();
  const entries = auditQuery.data ?? [];

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Audit Log</h2>
        <span className="text-xs text-muted-foreground">
          ({entries.length})
        </span>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <Table data-ocid="audit.table">
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Timestamp
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Action
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Entity
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider w-16">
                ID
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                By
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Detail
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditQuery.isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-border">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-muted/40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : entries.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={6}
                  className="py-12 text-center"
                  data-ocid="audit.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    No audit entries yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, idx) => (
                <TableRow
                  key={entry.id.toString()}
                  className="border-border hover:bg-muted/20"
                  data-ocid={`audit.row.item.${idx + 1}`}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(entry.timestamp)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {entry.action}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.entityType}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.entityId.toString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.performedBy.toString().slice(0, 12)}…
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {entry.details}
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
