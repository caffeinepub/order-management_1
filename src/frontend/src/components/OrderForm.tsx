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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Order } from "../backend.d";

export interface FormData {
  orderId: string;
  consumerNo: string;
  contactNo: string;
  customerName: string;
  address: string;
  orderDate: string;
  expectedDelivery: string;
  product: string;
  quantityText: string;
  amountText: string;
  status: string;
  paymentStatus: string;
  paymentDate: string;
  collectDate: string;
  notes: string;
}

const STATUSES = ["Pending", "Active", "Completed", "Cancelled", "On Hold"];
const PAYMENT_STATUSES = ["Unpaid", "Partial", "Paid"];

const today = new Date().toISOString().split("T")[0];

const EMPTY: FormData = {
  orderId: "",
  consumerNo: "",
  contactNo: "",
  customerName: "",
  address: "",
  orderDate: today,
  expectedDelivery: "",
  product: "",
  quantityText: "1",
  amountText: "",
  status: "Pending",
  paymentStatus: "Unpaid",
  paymentDate: "",
  collectDate: "",
  notes: "",
};

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}

export function OrderForm({
  open,
  onOpenChange,
  order,
  onSubmit,
  isPending,
}: OrderFormProps) {
  const isEdit = !!order;
  const [form, setForm] = useState<FormData>(EMPTY);

  useEffect(() => {
    if (order) {
      setForm({
        orderId: order.orderId,
        consumerNo: order.consumerNo,
        contactNo: order.contactNo,
        customerName: order.customerName,
        address: order.address,
        orderDate: order.orderDate,
        expectedDelivery: order.expectedDelivery,
        product: order.product,
        quantityText: order.quantity.toString(),
        amountText: order.amount.toString(),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentDate: order.paymentDate,
        collectDate: order.collectDate,
        notes: order.notes,
      });
    } else {
      setForm(EMPTY);
    }
  }, [order]);

  const set =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="order.form.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {isEdit ? "Edit Order" : "New Order"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Order ID *
              </Label>
              <Input
                data-ocid="order.form.orderid.input"
                value={form.orderId}
                onChange={set("orderId")}
                required
                placeholder="e.g. ORD-001"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Consumer No *
              </Label>
              <Input
                data-ocid="order.form.consumerno.input"
                value={form.consumerNo}
                onChange={set("consumerNo")}
                required
                placeholder="Consumer No"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Contact No *
              </Label>
              <Input
                data-ocid="order.form.contactno.input"
                value={form.contactNo}
                onChange={set("contactNo")}
                required
                placeholder="Contact No"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Customer Name *
              </Label>
              <Input
                data-ocid="order.form.customername.input"
                value={form.customerName}
                onChange={set("customerName")}
                required
                placeholder="Full name"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Address
            </Label>
            <Input
              data-ocid="order.form.address.input"
              value={form.address}
              onChange={set("address")}
              placeholder="Address"
              className="bg-input border-border h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Order Date *
              </Label>
              <Input
                type="date"
                data-ocid="order.form.orderdate.input"
                value={form.orderDate}
                onChange={set("orderDate")}
                required
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Expected Delivery
              </Label>
              <Input
                type="date"
                data-ocid="order.form.expecteddelivery.input"
                value={form.expectedDelivery}
                onChange={set("expectedDelivery")}
                className="bg-input border-border h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Product *
            </Label>
            <Input
              data-ocid="order.form.product.input"
              value={form.product}
              onChange={set("product")}
              required
              placeholder="Product description"
              className="bg-input border-border h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Quantity *
              </Label>
              <Input
                type="number"
                min="1"
                data-ocid="order.form.quantity.input"
                value={form.quantityText}
                onChange={set("quantityText")}
                required
                placeholder="1"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Amount
              </Label>
              <Input
                type="number"
                step="0.01"
                data-ocid="order.form.amount.input"
                value={form.amountText}
                onChange={set("amountText")}
                placeholder="0.00"
                className="bg-input border-border h-8 text-sm"
              />
            </div>
          </div>
          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger
                    data-ocid="order.form.status.select"
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
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Payment Status
                </Label>
                <Select
                  value={form.paymentStatus}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, paymentStatus: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="order.form.paymentstatus.select"
                    className="bg-input border-border h-8 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Payment Date
                </Label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={set("paymentDate")}
                  className="bg-input border-border h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Collect Date
                </Label>
                <Input
                  type="date"
                  value={form.collectDate}
                  onChange={set("collectDate")}
                  className="bg-input border-border h-8 text-sm"
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Notes
            </Label>
            <Textarea
              data-ocid="order.form.notes.textarea"
              value={form.notes}
              onChange={set("notes")}
              placeholder="Optional notes"
              className="bg-input border-border text-sm resize-none h-16"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              data-ocid="order.form.submit_button"
              className="h-8 text-sm bg-primary text-primary-foreground"
            >
              {isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
