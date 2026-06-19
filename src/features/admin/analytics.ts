import type { Order } from "@/features/orders/types";

const DAY_MS = 86_400_000;

export interface Kpis {
  total: number;
  completed: number;
  cancelled: number;
  active: number;
  successRate: number;
}

export function computeKpis(orders: Order[]): Kpis {
  const total = orders.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const active = orders.filter((o) => o.status === "assigned" || o.status === "in_transit").length;
  const decided = completed + cancelled;
  const successRate = decided === 0 ? 0 : completed / decided;
  return { total, completed, cancelled, active, successRate };
}

export interface DayCount {
  date: string;
  count: number;
}

// UTC midnight (ms) for a given epoch-ms.
function dayStart(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const dayKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export function deliveriesPerDay(orders: Order[], days: number, nowMs: number): DayCount[] {
  const counts = new Map<string, number>();
  for (const o of orders) {
    if (o.status !== "completed") continue;
    const key = dayKey(dayStart(Date.parse(o.updatedAt)));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const todayStart = dayStart(nowMs);
  const out: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(todayStart - i * DAY_MS);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}

export function avgLeadTimeMinutes(orders: Order[]): number | null {
  const completed = orders.filter((o) => o.status === "completed");
  if (completed.length === 0) return null;
  const totalMs = completed.reduce((sum, o) => sum + (Date.parse(o.updatedAt) - Date.parse(o.createdAt)), 0);
  return Math.round(totalMs / completed.length / 60_000);
}
