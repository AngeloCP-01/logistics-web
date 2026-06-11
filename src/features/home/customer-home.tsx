import { Link } from "react-router-dom";
import { useActiveOrder } from "@/features/orders/use-active-order";
import { useMyOrders } from "@/features/orders/use-my-orders";
import { OrderCard } from "@/features/orders/order-card";
import { OrderStatusBadge } from "@/features/orders/order-status";
import { formatAddress } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function CustomerHome() {
  const active = useActiveOrder();
  const recent = useMyOrders("all");
  const recentOrders = (recent.data?.pages[0]?.items ?? []).slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home</h1>
        <Link to="/orders/new"><Button>Place order</Button></Link>
      </div>

      {active.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : active.data ? (
        <Link to={`/orders/${active.data.id}`} className="block">
          <Card className="space-y-2 border-indigo-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Active delivery</p>
              <OrderStatusBadge status={active.data.status} />
            </div>
            <p className="text-sm text-muted-foreground">To {formatAddress(active.data.dropoff)}</p>
          </Card>
        </Link>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-medium">Recent orders</h2>
        {recent.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : recentOrders.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Place your first order to get started.</p>
            <Link to="/orders/new" className="mt-3 inline-block"><Button size="sm">Place order</Button></Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => <OrderCard key={o.id} order={o} />)}
            <Link to="/orders" className="text-sm text-primary underline">View all orders</Link>
          </div>
        )}
      </section>
    </div>
  );
}
