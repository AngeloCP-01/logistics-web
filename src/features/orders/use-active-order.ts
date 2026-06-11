import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { Order, OrderPage } from "./types";

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
  });
}
