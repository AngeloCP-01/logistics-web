import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { OrderPage, OrderStatus } from "./types";

export function useMyOrders(status: OrderStatus | "all" = "all") {
  return useInfiniteQuery({
    queryKey: orderKeys.list(status),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (pageParam) params.set("cursor", pageParam);
      const qs = params.toString();
      return api<OrderPage>(`/orders/me${qs ? `?${qs}` : ""}`);
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}
