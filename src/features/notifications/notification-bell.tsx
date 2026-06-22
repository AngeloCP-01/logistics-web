import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useUnreadCount } from "./use-notifications";

export function NotificationBell() {
  const { data: count = 0 } = useUnreadCount();
  return (
    <Link to="/notifications" aria-label="Notifications" className="relative text-muted-foreground hover:text-foreground">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span
          data-testid="unread-badge"
          className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-medium text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
