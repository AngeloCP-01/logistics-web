import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { driverKeys } from "@/shared/api/query-keys";
import type { MyProfile, UpdateDriverInput } from "./driver-types";

export function useUpdateDriverProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDriverInput) =>
      api<MyProfile>("/users/me/driver", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverKeys.profile() });
    },
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (available: boolean) =>
      api<MyProfile>("/users/me/availability", { method: "PUT", body: JSON.stringify({ available }) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverKeys.profile() });
    },
  });
}
