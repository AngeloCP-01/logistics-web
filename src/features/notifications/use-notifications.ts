import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { notificationKeys } from "@/shared/api/query-keys";
import type { NotificationPage } from "./notification-types";

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.feed(),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      const qs = params.toString();
      return api<NotificationPage>(`/notifications${qs ? `?${qs}` : ""}`);
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async (): Promise<number> =>
      (await api<NotificationPage>("/notifications?status=unread&limit=50")).items.length,
    refetchInterval: 30_000,
  });
}

function invalidateNotifications(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: notificationKeys.feed() });
  void qc.invalidateQueries({ queryKey: notificationKeys.unread() });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => invalidateNotifications(qc),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const unread = await api<NotificationPage>("/notifications?status=unread&limit=50");
      await Promise.all(unread.items.map((n) => api<void>(`/notifications/${n.id}/read`, { method: "POST" })));
    },
    onSuccess: () => invalidateNotifications(qc),
  });
}
