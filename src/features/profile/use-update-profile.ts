import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { driverKeys } from "@/shared/api/query-keys";
import type { MyProfile, UpdateProfileRequest } from "./types";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileRequest) =>
      api<MyProfile>("/users/me", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driverKeys.profile() });
    },
  });
}
