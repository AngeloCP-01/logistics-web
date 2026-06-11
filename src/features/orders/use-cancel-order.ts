import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { orderKeys } from "@/shared/api/query-keys";
import type { Order } from "./types";

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api<Order>(`/orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(reason ? { reason } : {}),
      }),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      void qc.invalidateQueries({ queryKey: orderKeys.lists() });
      void qc.invalidateQueries({ queryKey: orderKeys.active() });
    },
  });
}
