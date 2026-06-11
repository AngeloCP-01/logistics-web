import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { addressKeys } from "@/shared/api/query-keys";
import type { Address, CreateAddressRequest } from "./types";

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddressRequest) =>
      api<Address>("/users/me/addresses", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}
