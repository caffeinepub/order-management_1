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
import { Loader2 } from "lucide-react";

interface DeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: bigint | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConfirm({
  open,
  onOpenChange,
  orderId,
  onConfirm,
  isPending,
}: DeleteConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="order.delete.dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-foreground">
            Delete Order #{orderId?.toString()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone. The order will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-ocid="order.delete.cancel_button"
            className="border-border text-foreground"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="order.delete.confirm_button"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : null}
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
