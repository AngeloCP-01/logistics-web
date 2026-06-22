import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { notificationKeys } from "@/shared/api/query-keys";
import type { Preferences } from "./notification-types";

export function usePreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => api<Preferences>("/notifications/preferences"),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Preferences) =>
      api<Preferences>("/notifications/preferences", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
