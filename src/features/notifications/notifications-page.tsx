import { useNotifications, useMarkRead, useMarkAllRead } from "./use-notifications";
import { usePreferences, useUpdatePreferences } from "./use-preferences";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function NotificationsPage() {
  const feed = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const prefs = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const hasUnread = items.some((n) => n.readAt === null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {hasUnread && (
          <Button size="sm" variant="outline" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
            {markAll.isPending ? "Marking…" : "Mark all read"}
          </Button>
        )}
      </div>

      {prefs.data && (
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted-foreground">{prefs.data.emailEnabled ? "On — you receive activity emails." : "Off — in-app only."}</p>
          </div>
          <Button
            size="sm"
            variant={prefs.data.emailEnabled ? "outline" : "default"}
            aria-label="Toggle email notifications"
            disabled={updatePrefs.isPending}
            onClick={() => updatePrefs.mutate({ emailEnabled: !prefs.data.emailEnabled })}
          >
            {prefs.data.emailEnabled ? "Turn off" : "Turn on"}
          </Button>
        </Card>
      )}

      {feed.isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : feed.isError ? (
        <p className="text-sm text-destructive">Could not load notifications.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">You're all caught up.</p>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-label={n.subject}
              disabled={n.readAt !== null || markRead.isPending}
              onClick={() => n.readAt === null && markRead.mutate(n.id)}
              className={`w-full rounded-md border p-3 text-left ${n.readAt === null ? "border-indigo-200 bg-indigo-50/40" : "opacity-70"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{n.subject}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
            </button>
          ))}
          {feed.hasNextPage && (
            <Button variant="outline" className="w-full" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>
              {feed.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
