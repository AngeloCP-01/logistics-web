import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { Order } from "./types";

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api<Order>(`/orders/${id}`),
  });
}
