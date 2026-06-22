import { useState } from "react";
import { toast } from "sonner";
import { useUnassignedOrders } from "./use-admin-orders";
import { useAvailableDrivers, useForceAssign } from "./use-dispatch-admin";
import { formatAddress } from "@/shared/lib/format";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

function DriverPicker({ orderId, onAssigned }: { orderId: string; onAssigned: () => void }) {
  const drivers = useAvailableDrivers();
  const forceAssign = useForceAssign();

  if (drivers.isLoading) return <Skeleton className="h-10 w-full" />;
  const items = drivers.data?.items ?? [];
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No drivers are online right now.</p>;

  const assign = (driverId: string) =>
    forceAssign.mutate(
      { orderId, driverId },
      {
        onSuccess: () => { toast.success("Driver assigned."); onAssigned(); },
        onError: (err) =>
          toast.error(err instanceof ApiError && (err.status === 409 || err.status === 422) ? "That assignment is no longer possible." : "Could not assign the driver."),
      },
    );

  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div key={d.driverId} className="flex items-center justify-between rounded-md border p-2 text-sm">
          <span>{d.displayName}{d.vehicleType ? ` · ${d.vehicleType}` : ""}</span>
          <Button size="sm" disabled={forceAssign.isPending} onClick={() => assign(d.driverId)}>Assign</Button>
        </div>
      ))}
    </div>
  );
}

export function ManualDispatchPage() {
  const orders = useUnassignedOrders();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Manual dispatch</h1>
      <p className="text-sm text-muted-foreground">Orders awaiting a driver. Assign one of the currently-online drivers.</p>

      {orders.isLoading ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : orders.isError ? (
        <p className="text-sm text-destructive">Could not load orders.</p>
      ) : (orders.data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No orders waiting for dispatch.</p>
      ) : (
        <div className="space-y-3">
          {orders.data?.items.map((o) => (
            <Card key={o.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</p>
                  <p>To {formatAddress(o.dropoff)}</p>
                </div>
                {selected === o.id ? (
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Cancel</Button>
                ) : (
                  <Button size="sm" onClick={() => setSelected(o.id)}>Assign driver</Button>
                )}
              </div>
              {selected === o.id && <DriverPicker orderId={o.id} onAssigned={() => setSelected(null)} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
