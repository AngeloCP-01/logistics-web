import { useState } from "react";
import { useCancelOrder } from "./use-cancel-order";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/shared/ui/dialog";

export function CancelOrderDialog({ orderId }: { orderId: string }) {
  const cancel = useCancelOrder();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);
    try {
      await cancel.mutateAsync(reason.trim() ? { id: orderId, reason: reason.trim() } : { id: orderId });
      setOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.title : "Could not cancel the order");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Cancel order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="cancelReason">Reason (optional)</Label>
          <Textarea id="cancelReason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Keep order</Button>
          <Button variant="destructive" disabled={cancel.isPending} onClick={() => void onConfirm()}>
            Confirm cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
