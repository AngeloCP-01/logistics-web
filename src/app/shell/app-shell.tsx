import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/auth-store";
import { logoutRequest } from "@/features/auth/session";
import { Button } from "@/shared/ui/button";

const NAV: Record<string, { to: string; label: string }[]> = {
  customer: [
    { to: "/", label: "Home" },
    { to: "/orders", label: "Orders" },
  ],
  driver: [{ to: "/driver", label: "Today" }, { to: "/driver/offers", label: "Offers" }],
  admin: [
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/drivers", label: "Drivers" },
    { to: "/admin/dispatch", label: "Dispatch" },
    { to: "/admin/analytics", label: "Analytics" },
  ],
};

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const links = user ? (NAV[user.role] ?? []) : [];

  async function onLogout() {
    await logoutRequest();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-6 border-b px-6 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-4 w-4 rounded bg-primary" /> Loomis
        </div>
        <nav className="flex gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={onLogout}>Log out</Button>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  );
}
