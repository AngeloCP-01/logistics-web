import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAssignment } from "./use-dispatch-queries";
import { useDriverActiveStore } from "./driver-active-store";
import { useGeolocationStream } from "./use-geolocation-stream";
import { useTrackingSocket } from "@/features/tracking/use-tracking-socket";
import { useRouteSeed } from "@/features/tracking/use-tracking-seed";
import { TrackingMap } from "@/features/tracking/tracking-map";
import type { LatLng, TrackingPhase } from "@/features/tracking/tracking-types";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";

export function ActiveDeliveryPage() {
  const { orderId = "" } = useParams();
  const clearActive = useDriverActiveStore((s) => s.clearActive);
  const assignment = useAssignment(orderId);
  const routeSeed = useRouteSeed(orderId);
  const live = useTrackingSocket(orderId);
  const [sharing, setSharing] = useState(true);

  const phase: TrackingPhase =
    live.phase ?? (assignment.data?.status === "completed" ? "completed" : "pending");

  // Stream geolocation into the socket while sharing and the delivery isn't done.
  useGeolocationStream(sharing && phase !== "completed", (p) => live.sendLocation(p.lat, p.lng, p.accuracy));

  // Clear the persisted active order once the delivery completes.
  useEffect(() => {
    if (phase === "completed") clearActive();
  }, [phase, clearActive]);

  if (assignment.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (assignment.error || !assignment.data) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-muted-foreground">Could not load this delivery.</p>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-8 text-center">
        <Card className="space-y-1 border-emerald-200 p-6">
          <p className="text-lg font-medium text-emerald-700">Delivery complete</p>
          <p className="text-sm text-muted-foreground">Nice work — you're free to take new offers.</p>
        </Card>
        <Link to="/driver">
          <Button>Back to Today</Button>
        </Link>
      </div>
    );
  }

  const a = assignment.data;
  const dropoff: LatLng = { lat: a.order.dropoff.lat, lng: a.order.dropoff.lng };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Active delivery</h1>
          <p className="text-sm text-muted-foreground">
            To {a.order.dropoff.street}, {a.order.dropoff.city}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sharing} onChange={(e) => setSharing(e.target.checked)} />
          Share location
        </label>
      </div>

      <TrackingMap routePoints={routeSeed.data?.items ?? []} latest={live.latest} dropoff={dropoff} />

      <Card className="space-y-2 p-4">
        <h2 className="font-medium">Items</h2>
        <ul className="space-y-1 text-sm">
          {a.order.items.map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>{it.description}</span>
              <span className="text-muted-foreground">×{it.quantity}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex gap-3">
        {phase === "pending" && <Button onClick={() => live.sendPickup()}>Picked up</Button>}
        {phase === "in_transit" && <Button onClick={() => live.sendComplete()}>Delivered</Button>}
      </div>

      {live.error && (
        <p className="text-xs text-rose-700">Live updates interrupted: {live.error}</p>
      )}
    </div>
  );
}
