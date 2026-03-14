import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Loader2, PauseCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole, AppUser, Order, Stage } from "../backend.d";
import {
  useAddUpdate,
  useCompleteStage,
  useListOrderStages,
  useListUpdates,
  useOverrideStageDate,
} from "../hooks/useQueries";

function hasRoleIntersection(
  userRoleIds: bigint[],
  stageRoleIds: bigint[],
): boolean {
  return userRoleIds.some((id) => stageRoleIds.includes(id));
}

function isManagerOrAdmin(user: AppUser | null | undefined): boolean {
  return !!user?.roleIds.some((id) => id === 1n || id === 2n);
}

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

interface StageRowProps {
  stage: Stage;
  orderId: bigint;
  completed: boolean;
  completedDate: string;
  manualDateOverride: string;
  note: string;
  currentUser: AppUser | null | undefined;
  index: number;
}

function StageRow({
  stage,
  orderId,
  completed,
  completedDate,
  manualDateOverride,
  note,
  currentUser,
  index,
}: StageRowProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideNote, setOverrideNote] = useState("");

  const completeStageMutation = useCompleteStage();
  const overrideStageDateMutation = useOverrideStageDate();

  const canComplete =
    !completed &&
    !!currentUser &&
    hasRoleIntersection(currentUser.roleIds, stage.roleIds);
  const canOverride = isManagerOrAdmin(currentUser);
  const displayDate = manualDateOverride || completedDate;

  const handleComplete = async () => {
    try {
      await completeStageMutation.mutateAsync({
        orderId,
        stageId: stage.id,
        note: completeNote,
      });
      toast.success(`Stage "${stage.stageName}" completed`);
      setShowComplete(false);
      setCompleteNote("");
    } catch {
      toast.error("Failed to complete stage");
    }
  };

  const handleOverride = async () => {
    if (!overrideDate) return;
    try {
      await overrideStageDateMutation.mutateAsync({
        orderId,
        stageId: stage.id,
        date: overrideDate,
        note: overrideNote,
      });
      toast.success("Date overridden");
      setShowOverride(false);
      setOverrideDate("");
      setOverrideNote("");
    } catch {
      toast.error("Failed to override date");
    }
  };

  return (
    <div
      className="py-3 space-y-2"
      data-ocid={`order.detail.stage.item.${index}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {completed ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {stage.stageName}
            </p>
            {completed && displayDate && (
              <p className="text-xs text-muted-foreground">
                {manualDateOverride ? "Override: " : ""}
                {displayDate}
              </p>
            )}
            {completed && note && (
              <p className="text-xs text-muted-foreground/70 italic truncate">
                {note}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComplete((v) => !v)}
              className="h-6 text-xs px-2 border-border"
            >
              Complete
            </Button>
          )}
          {canOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOverride((v) => !v)}
              className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              Override
            </Button>
          )}
        </div>
      </div>

      {showComplete && (
        <div className="ml-6 space-y-2 p-3 bg-muted/30 rounded-sm border border-border">
          <Textarea
            placeholder="Optional note..."
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
            className="h-16 text-xs bg-input border-border resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completeStageMutation.isPending}
              className="h-7 text-xs bg-primary text-primary-foreground"
            >
              {completeStageMutation.isPending && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              Confirm
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowComplete(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showOverride && (
        <div className="ml-6 space-y-2 p-3 bg-muted/30 rounded-sm border border-border">
          <input
            type="date"
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
            className="w-full h-8 text-xs bg-input border border-border rounded-sm px-2 text-foreground"
          />
          <Textarea
            placeholder="Note (optional)..."
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            className="h-16 text-xs bg-input border-border resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleOverride}
              disabled={overrideStageDateMutation.isPending || !overrideDate}
              className="h-7 text-xs bg-primary text-primary-foreground"
            >
              {overrideStageDateMutation.isPending && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowOverride(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
  currentUser: AppUser | null | undefined;
  roles: AppRole[];
  stages: Stage[];
}

export function OrderDetailDrawer({
  order,
  onClose,
  currentUser,
  roles: _roles,
  stages,
}: OrderDetailDrawerProps) {
  const [updateText, setUpdateText] = useState("");

  const orderStagesQuery = useListOrderStages(order?.id ?? null);
  const updatesQuery = useListUpdates(order?.id ?? null);
  const addUpdateMutation = useAddUpdate();

  const sortedStages = [...stages].sort(
    (a, b) => Number(a.stageOrder) - Number(b.stageOrder),
  );

  const getOrderStage = (stageId: bigint) =>
    orderStagesQuery.data?.find((os) => os.stageId === stageId);

  const handleAddUpdate = async () => {
    if (!order || !updateText.trim()) return;
    try {
      await addUpdateMutation.mutateAsync({
        orderId: order.id,
        text: updateText.trim(),
      });
      toast.success("Update added");
      setUpdateText("");
    } catch {
      toast.error("Failed to add update");
    }
  };

  const sortedUpdates = [...(updatesQuery.data ?? [])].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-border p-0 flex flex-col"
        data-ocid="order.detail.panel"
      >
        {order && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <SheetTitle className="flex items-center gap-2 text-base font-bold font-display">
                <span className="text-muted-foreground font-mono text-sm">
                  #{order.id.toString()}
                </span>
                <span>{order.customerName}</span>
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {order.consumerNo}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${getStatusClass(order.status)}`}
                >
                  {order.status}
                </span>
                {order.holdFlag && (
                  <PauseCircle className="w-3.5 h-3.5 text-yellow-400" />
                )}
                {order.allClearFlag && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                )}
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6">
              {/* Stage Progress */}
              <div className="py-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Stage Progress
                </h3>
                {orderStagesQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full bg-muted/40" />
                    ))}
                  </div>
                ) : sortedStages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No stages configured.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {sortedStages.map((stage, idx) => {
                      const os = getOrderStage(stage.id);
                      return (
                        <StageRow
                          key={stage.id.toString()}
                          stage={stage}
                          orderId={order.id}
                          completed={os?.completed ?? false}
                          completedDate={os?.completedDate ?? ""}
                          manualDateOverride={os?.manualDateOverride ?? ""}
                          note={os?.note ?? ""}
                          currentUser={currentUser}
                          index={idx + 1}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator className="bg-border" />

              {/* Updates Feed */}
              <div className="py-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Updates
                </h3>

                <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                  {updatesQuery.isLoading ? (
                    <Skeleton className="h-16 w-full bg-muted/40" />
                  ) : sortedUpdates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No updates yet.
                    </p>
                  ) : (
                    sortedUpdates.map((upd) => (
                      <div
                        key={upd.id.toString()}
                        className="text-sm text-foreground bg-muted/20 rounded-sm px-3 py-2 border border-border"
                      >
                        <p className="text-xs text-foreground">{upd.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {upd.createdBy.toString().slice(0, 12)}…
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    data-ocid="order.detail.update.input"
                    placeholder="Add an update..."
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    className="h-20 text-sm bg-input border-border resize-none"
                  />
                  <Button
                    data-ocid="order.detail.add_update.button"
                    onClick={handleAddUpdate}
                    disabled={addUpdateMutation.isPending || !updateText.trim()}
                    size="sm"
                    className="h-8 text-sm bg-primary text-primary-foreground gap-1.5"
                  >
                    {addUpdateMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Add Update
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
