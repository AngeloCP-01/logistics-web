import { Link, useParams } from "react-router-dom";
import { useOrder } from "./use-order";
import { OrderStatusBadge, statusLabel } from "./order-status";
import { CancelOrderDialog } from "./cancel-order-dialog";
import type { Order, OrderStatus } from "./types";
import { formatAddress, formatDateTime } from "@/shared/lib/format";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";

const STEPS: OrderStatus[] = ["created", "assigned", "in_transit", "completed"];
const CANCELLABLE: OrderStatus[] = ["created", "assigned"];
const TRACKABLE: OrderStatus[] = ["assigned", "in_transit"];

function Timeline({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return <p className="text-sm text-rose-700">Cancelled{order.cancelReason ? ` — ${order.cancelReason}` : ""}.</p>;
  }
  const reachedIdx = STEPS.indexOf(order.status);
  return (
    <ol className="flex flex-wrap gap-2 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className={i <= reachedIdx ? "font-medium text-foreground" : "text-muted-foreground"}>
          {statusLabel(s)}{i < STEPS.length - 1 ? " →" : ""}
        </li>
      ))}
    </ol>
  );
}

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading) return <div className="mx-auto max-w-2xl space-y-3 p-8"><Skeleton className="h-8 w-40" /><Skeleton className="h-32 w-full" /></div>;
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return <div className="mx-auto max-w-2xl p-8"><p className="text-sm text-muted-foreground">{notFound ? "Order not found." : "Could not load this order."}</p></div>;
  }
  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Order</h1>
          <p className="text-xs text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card className="space-y-2 p-4">
        <h2 className="font-medium">Status</h2>
        <Timeline order={order} />
      </Card>

      <Card className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Pickup</h2>
          <p>{formatAddress(order.pickup)}</p>
        </div>
        <Separator />
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Dropoff</h2>
          <p>{formatAddress(order.dropoff)}</p>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <h2 className="font-medium">Items</h2>
        <ul className="space-y-1 text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>{it.description}</span>
              <span className="text-muted-foreground">×{it.quantity}{it.weightKg ? ` · ${it.weightKg}kg` : ""}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        {TRACKABLE.includes(order.status) && (
          <Link to={`/track/${order.id}`}>
            <Button>Track delivery</Button>
          </Link>
        )}
        {CANCELLABLE.includes(order.status) && <CancelOrderDialog orderId={order.id} />}
      </div>
    </div>
  );
}
