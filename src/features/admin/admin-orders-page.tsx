import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminOrders } from "./use-admin-orders";
import { OrderStatusBadge, statusLabel } from "@/features/orders/order-status";
import type { OrderStatus } from "@/features/orders/types";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const STATUSES: OrderStatus[] = ["created", "assigned", "in_transit", "completed", "cancelled"];

export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useAdminOrders(status);
  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="statusFilter" className="text-sm text-muted-foreground">Status</label>
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
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load orders.</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders match this filter.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dropoff</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    <Link to={`/admin/orders/${o.id}`} className="text-primary underline">{o.id.slice(0, 8)}</Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{o.customerId.slice(0, 8)}</TableCell>
                  <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                  <TableCell>{o.dropoff.city}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasNextPage && (
            <Button variant="outline" className="w-full" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
