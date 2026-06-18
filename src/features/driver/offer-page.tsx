import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentOffer } from "./use-dispatch-queries";
import { useAcceptOffer, useRejectOffer } from "./use-offer-actions";
import { useDriverActiveStore } from "./driver-active-store";
import { OfferCountdown } from "./offer-countdown";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";

export function OfferPage() {
  const navigate = useNavigate();
  const setActive = useDriverActiveStore((s) => s.setActive);
  const offer = useCurrentOffer(true);
  const accept = useAcceptOffer();
  const reject = useRejectOffer();

  if (offer.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!offer.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">No current offer.</p>
        <Link to="/driver" className="text-sm text-primary underline">
          Back to Today
        </Link>
      </div>
    );
  }

  const o = offer.data;

  const onConflict = (message: string) => {
    toast.error(message);
    navigate("/driver");
  };

  const onAccept = () =>
    accept.mutate(o.orderId, {
      onSuccess: () => {
        setActive(o.orderId);
        navigate(`/driver/active/${o.orderId}`);
      },
      onError: (err) =>
        onConflict(
          err instanceof ApiError && err.status === 409
            ? "This offer is no longer available."
            : "Could not accept the offer.",
        ),
    });

  const onReject = () =>
    reject.mutate(o.orderId, {
      onSuccess: () => navigate("/driver"),
      onError: (err) =>
        onConflict(
          err instanceof ApiError && err.status === 409
            ? "This offer already expired."
            : "Could not reject the offer.",
        ),
    });

  const busy = accept.isPending || reject.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Incoming offer</h1>
        <OfferCountdown expiresAt={o.expiresAt} />
      </div>

      <Card className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Pickup</h2>
          <p>
            {o.order.pickup.street}, {o.order.pickup.city}
          </p>
        </div>
        <Separator />
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Dropoff</h2>
          <p>
            {o.order.dropoff.street}, {o.order.dropoff.city}
          </p>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <h2 className="font-medium">Items</h2>
        {o.order.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No item details.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {o.order.items.map((it, i) => (
              <li key={i} className="flex justify-between">
                <span>{it.description}</span>
                <span className="text-muted-foreground">×{it.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex gap-3">
        <Button onClick={onAccept} disabled={busy}>
          Accept
        </Button>
        <Button variant="outline" onClick={onReject} disabled={busy}>
          Reject
        </Button>
      </div>
    </div>
  );
}
