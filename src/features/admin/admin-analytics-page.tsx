import { useAllOrders } from "./use-all-orders";
import { computeKpis, deliveriesPerDay, avgLeadTimeMinutes } from "./analytics";
import { DeliveriesChart } from "./deliveries-chart";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="space-y-1 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}

export function AdminAnalyticsPage() {
  const { data: orders, isLoading, isError } = useAllOrders();

  if (isLoading) {
    return <div className="mx-auto max-w-4xl space-y-4 p-8"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (isError || !orders) {
    return <div className="mx-auto max-w-4xl p-8"><p className="text-sm text-destructive">Could not load analytics.</p></div>;
  }

  const kpis = computeKpis(orders);
  const perDay = deliveriesPerDay(orders, 14, Date.now());
  const leadTime = avgLeadTimeMinutes(orders);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total orders" value={String(kpis.total)} />
        <Kpi label="Completed" value={String(kpis.completed)} />
        <Kpi label="Active" value={String(kpis.active)} />
        <Kpi label="Success rate" value={`${Math.round(kpis.successRate * 100)}%`} />
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="font-medium">Deliveries per day (last 14 days)</h2>
        <DeliveriesChart data={perDay} />
      </Card>

      <p className="text-sm text-muted-foreground">
        Avg lead time (approx): {leadTime === null ? "—" : `${leadTime} min`}
        <span className="ml-1 text-xs">· based on created→last-updated for completed orders</span>
      </p>
    </div>
  );
}
