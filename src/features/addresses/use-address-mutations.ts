import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { addressKeys, driverKeys } from "@/shared/api/query-keys";
import type { Address, MyProfile, UpdateAddressRequest } from "./types";

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAddressRequest }) =>
      api<Address>(`/users/me/addresses/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/users/me/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) =>
      api<MyProfile>("/users/me/default-address", { method: "PUT", body: JSON.stringify({ addressId }) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: addressKeys.list() });
      void qc.invalidateQueries({ queryKey: driverKeys.profile() });
    },
  });
}
