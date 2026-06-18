import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { driverKeys } from "@/shared/api/query-keys";
import type { Assignment, CurrentOffer } from "./driver-types";

export function useCurrentOffer(enabled: boolean) {
  return useQuery({
    queryKey: driverKeys.currentOffer(),
    queryFn: async (): Promise<CurrentOffer | null> =>
      (await api<CurrentOffer | null>("/dispatch/offers/current")) ?? null,
    refetchInterval: 3000,
    enabled,
  });
}

export function useAssignment(orderId: string, enabled = true) {
  return useQuery({
    queryKey: driverKeys.assignment(orderId),
    queryFn: () => api<Assignment>(`/dispatch/assignments/${orderId}`),
    enabled,
  });
}
