import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { adminKeys } from "@/shared/api/query-keys";
import type { AvailableDriverPage } from "./admin-types";

export function useAvailableDrivers() {
  return useQuery({
    queryKey: adminKeys.availableDrivers(),
    queryFn: () => api<AvailableDriverPage>("/dispatch/drivers/available"),
  });
}

export function useForceAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      api<void>(`/dispatch/assignments/${orderId}/force-assign`, {
        method: "POST",
        body: JSON.stringify({ driverId }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.unassigned() });
      void qc.invalidateQueries({ queryKey: adminKeys.availableDrivers() });
    },
  });
}
