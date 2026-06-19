import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { adminKeys } from "@/shared/api/query-keys";
import type { Order, OrderPage } from "@/features/orders/types";

const MAX_ORDERS = 500;

export function useAllOrders() {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: async (): Promise<Order[]> => {
      const acc: Order[] = [];
      let cursor: string | null = null;
      do {
        const params = new URLSearchParams({ limit: "100" });
        if (cursor) params.set("cursor", cursor);
        const page = await api<OrderPage>(`/orders?${params.toString()}`);
        acc.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor && acc.length < MAX_ORDERS);
      return acc.slice(0, MAX_ORDERS);
    },
  });
}
