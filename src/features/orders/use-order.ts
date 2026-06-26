import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { Order, OrderStatus } from "./types";

const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>(["completed", "cancelled"]);
const POLL_MS = 5000;

// An order's status advances server-side (dispatch assigns, driver pickup/delivery
// events), and there's no live order endpoint — so poll while the order can still
// change and stop once it reaches a terminal status. Without this the detail page
// shows a stale status until a manual refresh.
export function orderPollInterval(status: OrderStatus | undefined): number | false {
  if (status && TERMINAL_STATUSES.has(status)) return false;
  return POLL_MS;
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api<Order>(`/orders/${id}`),
    refetchInterval: (query) => orderPollInterval(query.state.data?.status),
  });
}
