import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyOrders } from "./use-my-orders";
import { OrderCard } from "./order-card";
import type { OrderStatus } from "./types";
import { statusLabel } from "./order-status";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

const STATUSES: OrderStatus[] = ["created", "assigned", "in_transit", "completed", "cancelled"];

export function MyOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useMyOrders(status);
  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My orders</h1>
        <Link to="/orders/new"><Button size="sm">Place order</Button></Link>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="statusFilter" className="text-sm text-muted-foreground">Filter by status</label>
        <select
          id="statusFilter"
          aria-label="Filter by status"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
        >
          <option value="all">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load your orders.</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet. Place your first order to get started.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
          {hasNextPage && (
            <Button variant="outline" className="w-full" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
