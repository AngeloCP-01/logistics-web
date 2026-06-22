import { useParams } from "react-router-dom";
import { useOrder } from "@/features/orders/use-order";
import { OrderStatusBadge } from "@/features/orders/order-status";
import type { OrderStatus } from "@/features/orders/types";
import { ApiError } from "@/shared/api/api-error";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useLatestSeed, useRouteSeed } from "./use-tracking-seed";
import { useTrackingSocket } from "./use-tracking-socket";
import { etaMinutes } from "./eta";
import { TrackingMap } from "./tracking-map";
import type { LatLng, TrackingPhase } from "./tracking-types";

export function TrackPage() {
  const { orderId = "" } = useParams();
  const order = useOrder(orderId);
  const routeSeed = useRouteSeed(orderId);
  const latestSeed = useLatestSeed(orderId);
  const live = useTrackingSocket(orderId);

  if (order.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (order.error || !order.data) {
    const notFound = order.error instanceof ApiError && order.error.status === 404;
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-muted-foreground">
          {notFound ? "Order not found." : "Could not load this delivery."}
        </p>
      </div>
    );
  }

  const o = order.data;
  const dropoff: LatLng = { lat: o.dropoff.lat, lng: o.dropoff.lng };
  const latest = live.latest ?? latestSeed.data ?? null;
  const routePoints = routeSeed.data?.items ?? [];

  // WS lifecycle wins; otherwise derive from the order's seeded status.
  const phase: TrackingPhase =
    live.phase ??
    (o.status === "in_transit" ? "in_transit" : o.status === "completed" ? "completed" : "pending");

  // The badge follows the live phase too — the REST order status can lag behind
  // (the order-service reflector consumes lifecycle events asynchronously), so a
  // socket phase that's advanced past the seeded status wins.
  const badgeStatus: OrderStatus =
    phase === "completed" ? "completed" : phase === "in_transit" ? "in_transit" : o.status;

  const eta = phase === "in_transit" && latest ? etaMinutes(latest, dropoff) : null;
  const hasMapData = latest !== null || routePoints.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Track delivery</h1>
          <p className="text-sm text-muted-foreground">To {o.dropoff.street}, {o.dropoff.city}</p>
        </div>
        <OrderStatusBadge status={badgeStatus} />
      </div>

      {phase === "completed" ? (
        <Card className="space-y-1 border-emerald-200 p-6 text-center">
          <p className="text-lg font-medium text-emerald-700">Delivered</p>
          <p className="text-sm text-muted-foreground">Your package has arrived at its destination.</p>
        </Card>
      ) : hasMapData ? (
        <div className="space-y-3">
          <TrackingMap routePoints={routePoints} latest={latest} dropoff={dropoff} />
          {eta !== null && (
            <p className="text-sm font-medium text-muted-foreground">
              ETA ~{eta} min <span className="font-normal">(straight-line estimate)</span>
            </p>
          )}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Waiting for the driver to start moving…</p>
        </Card>
      )}

      {live.error && (
        <p className="text-xs text-rose-700">Live updates interrupted: {live.error}</p>
      )}
    </div>
  );
}
