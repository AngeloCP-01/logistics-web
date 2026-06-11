import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { CreateOrderRequest, Order } from "./types";

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderRequest) =>
      api<Order>("/orders", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orderKeys.lists() });
      void qc.invalidateQueries({ queryKey: orderKeys.active() });
    },
  });
}
