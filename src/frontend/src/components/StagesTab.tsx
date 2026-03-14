import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowDown,
  ArrowUp,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole, Stage } from "../backend.d";
import {
  useCreateStage,
  useDeleteStage,
  useUpdateStage,
} from "../hooks/useQueries";

interface StageFormData {
  name: string;
  orderIndex: string;
  assignedRoles: bigint[];
  sfaEnabled: boolean;
}

const EMPTY_FORM: StageFormData = {
  name: "",
  orderIndex: "1",
  assignedRoles: [],
  sfaEnabled: false,
};

function StageDialog({
  open,
  onOpenChange,
  initial,
  roles,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Stage | null;
  roles: AppRole[];
  onSave: (data: StageFormData) => Promise<void>;
  isPending: boolean;
}) {
  const [form, setForm] = useState<StageFormData>(
    initial
      ? {
          name: initial.name,
          orderIndex: initial.orderIndex.toString(),
          assignedRoles: [...initial.assignedRoles],
          sfaEnabled: initial.sfaEnabled,
        }
      : EMPTY_FORM,
  );

  const toggleRole = (roleId: bigint) =>
    setForm((prev) => ({
      ...prev,
      assignedRoles: prev.assignedRoles.includes(roleId)
        ? prev.assignedRoles.filter((id) => id !== roleId)
        : [...prev.assignedRoles, roleId],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="stages.create.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {initial ? "Edit Stage" : "New Stage"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Stage Name *
            </Label>
            <Input
              data-ocid="stages.create.input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Field Survey"
              className="bg-input border-border h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Display Order
            </Label>
            <Input
              type="number"
              min="1"
              value={form.orderIndex}
              onChange={(e) =>
                setForm((p) => ({ ...p, orderIndex: e.target.value }))
              }
              className="bg-input border-border h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Roles
            </Label>
            {roles.map((role) => (
              <div key={role.id.toString()} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={form.assignedRoles.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                <label
                  htmlFor={`role-${role.id}`}
                  className="text-sm text-foreground cursor-pointer"
                >
                  {role.name}
                </label>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="sfa-enabled"
              checked={form.sfaEnabled}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, sfaEnabled: !!v }))
              }
            />
            <label
              htmlFor="sfa-enabled"
              className="text-sm text-foreground cursor-pointer"
            >
              SFA Enabled
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(form)}
            disabled={isPending || !form.name.trim()}
            data-ocid="stages.create.submit_button"
            className="h-8 text-sm bg-primary text-primary-foreground"
          >
            {isPending && (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            )}
            {initial ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StagesTabProps {
  stages: Stage[];
  isLoading: boolean;
  roles: AppRole[];
}

export function StagesTab({ stages, isLoading, roles }: StagesTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editStage, setEditStage] = useState<Stage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);

  const createMutation = useCreateStage();
  const updateMutation = useUpdateStage();
  const deleteMutation = useDeleteStage();

  const sorted = [...stages].sort(
    (a, b) => Number(a.orderIndex) - Number(b.orderIndex),
  );

  const getRoleNames = (roleIds: bigint[]) =>
    roleIds.map((id) => roles.find((r) => r.id === id)?.name ?? `Role ${id}`);

  const handleCreate = async (data: StageFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name.trim(),
        orderIndex: BigInt(data.orderIndex || "1"),
        assignedRoles: data.assignedRoles,
        sfaEnabled: data.sfaEnabled,
      });
      toast.success("Stage created");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create stage");
    }
  };

  const handleUpdate = async (data: StageFormData) => {
    if (!editStage) return;
    try {
      await updateMutation.mutateAsync({
        id: editStage.id,
        name: data.name.trim(),
        orderIndex: BigInt(data.orderIndex || "1"),
        assignedRoles: data.assignedRoles,
        sfaEnabled: data.sfaEnabled,
      });
      toast.success("Stage updated");
      setEditStage(null);
    } catch {
      toast.error("Failed to update stage");
    }
  };

  const handleDelete = async (stage: Stage) => {
    try {
      await deleteMutation.mutateAsync(stage.id);
      toast.success(`Stage "${stage.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete stage");
    }
  };

  const handleReorder = async (stage: Stage, direction: "up" | "down") => {
    const idx = sorted.findIndex((s) => s.id === stage.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    try {
      await updateMutation.mutateAsync({
        id: stage.id,
        name: stage.name,
        orderIndex: other.orderIndex,
        assignedRoles: stage.assignedRoles,
        sfaEnabled: stage.sfaEnabled,
      });
      await updateMutation.mutateAsync({
        id: other.id,
        name: other.name,
        orderIndex: stage.orderIndex,
        assignedRoles: other.assignedRoles,
        sfaEnabled: other.sfaEnabled,
      });
      toast.success("Stage reordered");
    } catch {
      toast.error("Failed to reorder stage");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Workflow Stages
          </h2>
          <span className="text-xs text-muted-foreground">
            ({stages.length})
          </span>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-ocid="stages.create.open_modal_button"
          className="h-8 text-sm bg-primary text-primary-foreground gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Stage
        </Button>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <Table data-ocid="stages.table">
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider w-16">
                Order
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Stage Name
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Roles
              </TableHead>
              <TableHead className="w-36" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-border">
                  {[1, 2, 3, 4].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-muted/40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sorted.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={4}
                  className="py-12 text-center"
                  data-ocid="stages.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    No stages yet. Create your first stage.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((stage, idx) => (
                <TableRow
                  key={stage.id.toString()}
                  className="border-border hover:bg-muted/20"
                  data-ocid={`stages.row.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {stage.orderIndex.toString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {stage.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRoleNames(stage.assignedRoles).map((name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="text-xs px-1.5 py-0 h-4"
                        >
                          {name}
                        </Badge>
                      ))}
                      {stage.assignedRoles.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No roles
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(stage, "up")}
                        disabled={idx === 0 || updateMutation.isPending}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        data-ocid={`stages.up_button.${idx + 1}`}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(stage, "down")}
                        disabled={
                          idx === sorted.length - 1 || updateMutation.isPending
                        }
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        data-ocid={`stages.down_button.${idx + 1}`}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditStage(stage)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(stage)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        onSave={handleCreate}
        isPending={createMutation.isPending}
      />
      <StageDialog
        open={!!editStage}
        onOpenChange={(v) => !v && setEditStage(null)}
        initial={editStage}
        roles={roles}
        onSave={handleUpdate}
        isPending={updateMutation.isPending}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              Delete Stage
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="h-8 text-sm"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleteMutation.isPending}
              className="h-8 text-sm"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
