import { Link } from "react-router-dom";
import type { Order } from "./types";
import { OrderStatusBadge } from "./order-status";
import { formatAddress, formatDateTime } from "@/shared/lib/format";
import { Card } from "@/shared/ui/card";

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link to={`/orders/${order.id}`} className="block">
      <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
        <div className="space-y-1">
          <p className="text-sm font-medium">{formatAddress(order.dropoff)}</p>
          <p className="text-xs text-muted-foreground">
            {order.items.length} item{order.items.length === 1 ? "" : "s"} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </Card>
    </Link>
  );
}
