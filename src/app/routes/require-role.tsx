import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, type Role } from "@/features/auth/auth-store";

export function RequireRole({ role }: { role: Role }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthed = useAuthStore((s) => s.isAuthenticated());

  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user?.role !== role) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
