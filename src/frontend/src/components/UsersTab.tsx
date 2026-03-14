import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Shield, Trash2, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole, AppUser } from "../backend.d";
import {
  useAssignRoles,
  useCreateRole,
  useDeleteUser,
  useListRoles,
  useListUsers,
} from "../hooks/useQueries";

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}\u2026${p.slice(-6)}`;
}

function getRoleNames(roleIds: bigint[], roles: AppRole[]): string[] {
  return roleIds
    .map((rid) => roles.find((r) => r.id === rid)?.name ?? `Role ${rid}`)
    .filter(Boolean) as string[];
}

function CreateRoleDialog({
  open,
  onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const createRole = useCreateRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRole.mutateAsync({ name, desc });
      toast.success("Role created");
      setName("");
      setDesc("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-card border-border"
        data-ocid="role.create.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Create Role
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Role Name *
            </Label>
            <Input
              data-ocid="role.create.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Viewer"
              className="bg-input border-border h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              data-ocid="role.create.textarea"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description"
              className="bg-input border-border text-sm resize-none"
              rows={2}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-ocid="role.create.cancel_button"
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRole.isPending}
              data-ocid="role.create.submit_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {createRole.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              )}
              {createRole.isPending ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignRolesDialog({
  user,
  roles,
  open,
  onOpenChange,
}: {
  user: AppUser | null;
  roles: AppRole[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selected, setSelected] = useState<Set<bigint>>(new Set());
  const assignRoles = useAssignRoles();

  const handleOpen = (v: boolean) => {
    if (v && user) setSelected(new Set(user.roles));
    onOpenChange(v);
  };

  const toggle = (id: bigint) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = async () => {
    if (!user) return;
    try {
      await assignRoles.mutateAsync({
        userId: user.id,
        roleIds: Array.from(selected),
      });
      toast.success(`Roles updated for ${user.username}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to assign roles");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="max-w-sm bg-card border-border"
        data-ocid="user.assign_roles.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Assign Roles — {user?.username}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {roles.map((role) => (
            <div key={role.id.toString()} className="flex items-start gap-3">
              <Checkbox
                id={`role-${role.id}`}
                data-ocid="user.assign_roles.checkbox"
                checked={selected.has(role.id)}
                onCheckedChange={() => toggle(role.id)}
                className="mt-0.5"
              />
              <label
                htmlFor={`role-${role.id}`}
                className="cursor-pointer space-y-0.5"
              >
                <p className="text-sm font-medium text-foreground">
                  {role.name}
                </p>
                {role.description && (
                  <p className="text-xs text-muted-foreground">
                    {role.description}
                  </p>
                )}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-ocid="user.assign_roles.cancel_button"
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={assignRoles.isPending}
            data-ocid="user.assign_roles.save_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {assignRoles.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            )}
            {assignRoles.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTab() {
  const usersQuery = useListUsers();
  const rolesQuery = useListRoles();
  const deleteUser = useDeleteUser();

  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const isLoading = usersQuery.isLoading;

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success(`User "${deleteTarget.username}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          onClick={() => setCreateRoleOpen(true)}
          data-ocid="role.create.open_modal_button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-sm border-border"
        >
          <Shield className="w-3.5 h-3.5" />
          <Plus className="w-3 h-3" /> New Role
        </Button>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <Table data-ocid="user.table">
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider w-12">
                ID
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Username
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Principal
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Roles
              </TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-border">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}>
                      <Skeleton
                        className="h-4 w-full bg-muted/40"
                        data-ocid={
                          i === 1 && j === 1 ? "user.loading_state" : undefined
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                  data-ocid="user.empty_state"
                >
                  No users registered yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => (
                <TableRow
                  key={user.id.toString()}
                  className="border-border hover:bg-muted/20"
                  data-ocid={`user.row.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {user.id.toString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {user.username}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {truncatePrincipal(user.principal.toString())}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRoleNames(user.roles, roles).map((name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="text-xs px-1.5 py-0"
                        >
                          {name}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
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
                        onClick={() => setAssignTarget(user)}
                        data-ocid={`user.edit_button.${idx + 1}`}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        title="Assign Roles"
                      >
                        <UserCog className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(user)}
                        data-ocid={`user.delete_button.${idx + 1}`}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Delete User"
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

      {roles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Available Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <div
                key={role.id.toString()}
                className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-sm"
              >
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  {role.name}
                </span>
                {role.description && (
                  <span className="text-xs text-muted-foreground">
                    — {role.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateRoleDialog
        open={createRoleOpen}
        onOpenChange={setCreateRoleOpen}
      />
      <AssignRolesDialog
        user={assignTarget}
        roles={roles}
        open={!!assignTarget}
        onOpenChange={(v) => !v && setAssignTarget(null)}
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="user.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Delete &ldquo;{deleteTarget?.username}&rdquo;? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="user.delete.cancel_button"
              className="border-border text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              data-ocid="user.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              )}
              {deleteUser.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
