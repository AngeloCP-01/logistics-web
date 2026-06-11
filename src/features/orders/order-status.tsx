import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { OrderStatus } from "./types";

const LABELS: Record<OrderStatus, string> = {
  created: "Created",
  assigned: "Assigned",
  in_transit: "In transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Lifecycle-color mapping (spec §10). Tailwind classes; ui-ux-pro-max may refine the exact palette.
const CLASSES: Record<OrderStatus, string> = {
  created: "bg-slate-100 text-slate-700",
  assigned: "bg-indigo-100 text-indigo-700",
  in_transit: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export function statusLabel(status: OrderStatus): string {
  return LABELS[status];
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", CLASSES[status], className)}>
      {LABELS[status]}
    </Badge>
  );
}
