import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export const queryKeys = {
  me: ["me"] as const,
  notificationsUnread: ["notifications", "unread-count"] as const,
};
