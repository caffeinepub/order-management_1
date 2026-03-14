import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Order } from "../backend.d";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}

export interface FormData {
  consumerNo: string;
  contactNo: string;
  customerName: string;
  address: string;
  product: string;
  amountText: string;
  expectedPaymentDate: string;
  status?: string;
}

const STATUSES = ["active", "pending", "completed", "cancelled", "on-hold"];

export function OrderForm({
  open,
  onOpenChange,
  order,
  onSubmit,
  isPending,
}: OrderFormProps) {
  const isEdit = !!order;
  const [form, setForm] = useState<FormData>({
    consumerNo: "",
    contactNo: "",
    customerName: "",
    address: "",
    product: "",
    amountText: "",
    expectedPaymentDate: "",
    status: "active",
  });

  useEffect(() => {
    if (order) {
      setForm({
        consumerNo: order.consumerNo,
        contactNo: order.contactNo,
        customerName: order.customerName,
        address: order.address,
        product: order.product,
        amountText: order.amountText,
        expectedPaymentDate: order.expectedPaymentDate,
        status: order.status,
      });
    } else {
      setForm({
        consumerNo: "",
        contactNo: "",
        customerName: "",
        address: "",
        product: "",
        amountText: "",
        expectedPaymentDate: "",
        status: "active",
      });
    }
  }, [order]);

  const set =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg bg-card border-border"
        data-ocid={isEdit ? "order.edit.dialog" : "order.create.dialog"}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold text-foreground">
            {isEdit ? `Edit Order #${order?.id}` : "New Order"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Consumer No *
              </Label>
              <Input
                data-ocid={
                  isEdit
                    ? "order.edit.consumerNo.input"
                    : "order.create.consumerNo.input"
                }
                value={form.consumerNo}
                onChange={set("consumerNo")}
                required
                placeholder="CNS-001"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Contact No *
              </Label>
              <Input
                data-ocid={
                  isEdit
                    ? "order.edit.contactNo.input"
                    : "order.create.contactNo.input"
                }
                value={form.contactNo}
                onChange={set("contactNo")}
                required
                placeholder="+1 555-0100"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Customer Name *
            </Label>
            <Input
              data-ocid={
                isEdit
                  ? "order.edit.customerName.input"
                  : "order.create.customerName.input"
              }
              value={form.customerName}
              onChange={set("customerName")}
              required
              placeholder="John Doe"
              className="bg-input border-border h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Address *
            </Label>
            <Input
              data-ocid={
                isEdit
                  ? "order.edit.address.input"
                  : "order.create.address.input"
              }
              value={form.address}
              onChange={set("address")}
              required
              placeholder="123 Main St, City"
              className="bg-input border-border h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Product *
              </Label>
              <Input
                data-ocid={
                  isEdit
                    ? "order.edit.product.input"
                    : "order.create.product.input"
                }
                value={form.product}
                onChange={set("product")}
                required
                placeholder="Product name"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Amount *
              </Label>
              <Input
                data-ocid={
                  isEdit
                    ? "order.edit.amountText.input"
                    : "order.create.amountText.input"
                }
                value={form.amountText}
                onChange={set("amountText")}
                required
                placeholder="$1,200.00"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Expected Payment Date *
              </Label>
              <Input
                data-ocid={
                  isEdit
                    ? "order.edit.paymentDate.input"
                    : "order.create.paymentDate.input"
                }
                value={form.expectedPaymentDate}
                onChange={set("expectedPaymentDate")}
                required
                placeholder="2026-04-01"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            {isEdit && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, status: val }))
                  }
                >
                  <SelectTrigger
                    data-ocid="order.edit.status.select"
                    className="bg-input border-border h-8 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-ocid={
                isEdit
                  ? "order.edit.cancel_button"
                  : "order.create.cancel_button"
              }
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid={
                isEdit
                  ? "order.edit.submit_button"
                  : "order.create.submit_button"
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : null}
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
