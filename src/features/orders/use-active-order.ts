import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { Order, OrderPage } from "./types";

// The active order is inherently transient (a driver pickup advances it, a delivery
// clears it), and there's no live endpoint — so poll so the Home banner reflects
// pickups/completions without a manual refresh.
const ACTIVE_POLL_MS = 5000;

// No backend "active order" endpoint exists; derive it: an in_transit order outranks an assigned one.
export function useActiveOrder() {
  return useQuery({
    queryKey: orderKeys.active(),
    queryFn: async (): Promise<Order | null> => {
      const transit = await api<OrderPage>("/orders/me?status=in_transit&limit=1");
      if (transit.items[0]) return transit.items[0];
      const assigned = await api<OrderPage>("/orders/me?status=assigned&limit=1");
      return assigned.items[0] ?? null;
    },
    refetchInterval: ACTIVE_POLL_MS,
  });
}
