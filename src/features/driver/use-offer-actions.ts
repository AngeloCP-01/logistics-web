import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { driverKeys } from "@/shared/api/query-keys";

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api<void>(`/dispatch/assignments/${orderId}/accept`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverKeys.all });
    },
  });
}

export function useRejectOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api<void>(`/dispatch/assignments/${orderId}/reject`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverKeys.currentOffer() });
    },
  });
}
