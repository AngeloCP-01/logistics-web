import type { Role } from "@/features/auth/auth-store";

export function homePathFor(role: Role): string {
  switch (role) {
    case "customer": return "/";
    case "driver": return "/driver";
    case "admin": return "/admin/orders";
  }
}
