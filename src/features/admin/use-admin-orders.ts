import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { adminKeys } from "@/shared/api/query-keys";
import type { Order, OrderPage, OrderStatus } from "@/features/orders/types";

export function useAdminOrders(status: OrderStatus | "all" = "all") {
  return useInfiniteQuery({
    queryKey: adminKeys.orders(status),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (pageParam) params.set("cursor", pageParam);
      const qs = params.toString();
      return api<OrderPage>(`/orders${qs ? `?${qs}` : ""}`);
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: adminKeys.order(id),
    queryFn: () => api<Order>(`/orders/${id}`),
  });
}

export function useUnassignedOrders() {
  return useQuery({
    queryKey: adminKeys.unassigned(),
    queryFn: () => api<OrderPage>("/orders?status=created&limit=50"),
  });
}
