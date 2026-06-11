import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { addressKeys } from "@/shared/api/query-keys";
import type { Address } from "./types";

interface AddressPage {
  items: Address[];
  nextCursor: string | null;
}

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: async () => (await api<AddressPage>("/users/me/addresses")).items,
  });
}
