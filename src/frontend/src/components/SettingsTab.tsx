import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Loader2, Pencil, Settings, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetSetting, useSetSetting } from "../hooks/useQueries";

const SETTING_KEYS = [
  { key: "app_name", label: "App Name" },
  { key: "contact_email", label: "Contact Email" },
  { key: "timezone", label: "Timezone" },
  { key: "currency", label: "Currency" },
];

interface SettingRowProps {
  settingKey: string;
  label: string;
  index: number;
}

function SettingRow({ settingKey, label, index }: SettingRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const valueQuery = useGetSetting(settingKey);
  const setSettingMutation = useSetSetting();

  const currentValue = valueQuery.data ?? "";

  const handleEdit = () => {
    setEditValue(currentValue);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await setSettingMutation.mutateAsync({
        key: settingKey,
        value: editValue,
      });
      toast.success(`${label} updated`);
      setEditing(false);
    } catch {
      toast.error(`Failed to update ${label}`);
    }
  };

  return (
    <TableRow
      className="border-border hover:bg-muted/20"
      data-ocid={`settings.row.item.${index}`}
    >
      <TableCell className="text-sm font-medium text-foreground">
        {label}
      </TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground">
        {settingKey}
      </TableCell>
      <TableCell>
        {valueQuery.isLoading ? (
          <Skeleton className="h-4 w-32 bg-muted/40" />
        ) : editing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-7 text-sm bg-input border-border max-w-xs"
            autoFocus
          />
        ) : (
          <span className="text-sm text-foreground">
            {currentValue || (
              <span className="text-muted-foreground italic">not set</span>
            )}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 justify-end">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={setSettingMutation.isPending}
                className="h-6 w-6 text-green-400 hover:text-green-300"
              >
                {setSettingMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(false)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              data-ocid={`settings.edit_button.${index}`}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SettingsTab() {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Settings</h2>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <Table data-ocid="settings.table">
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Label
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Key
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Value
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {SETTING_KEYS.map((s, idx) => (
              <SettingRow
                key={s.key}
                settingKey={s.key}
                label={s.label}
                index={idx + 1}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
