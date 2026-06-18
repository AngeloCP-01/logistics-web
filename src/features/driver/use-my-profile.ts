import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { driverKeys } from "@/shared/api/query-keys";
import type { MyProfile } from "./driver-types";

export function useMyProfile() {
  return useQuery({
    queryKey: driverKeys.profile(),
    queryFn: () => api<MyProfile>("/users/me"),
  });
}
