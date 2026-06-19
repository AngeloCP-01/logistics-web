import { describe, it, expect } from "vitest";
import { computeKpis, deliveriesPerDay, avgLeadTimeMinutes } from "./analytics";
import type { Order } from "@/features/orders/types";

function order(status: string, createdAt: string, updatedAt: string): Order {
  return { id: Math.random().toString(), customerId: "c1", status, pickup: { street: "1", city: "M", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "2", city: "C", country: "PH", lat: 1, lng: 2 }, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt, updatedAt } as Order;
}

describe("computeKpis", () => {
  it("counts statuses and computes success rate", () => {
    const orders = [
      order("completed", "2026-06-18T00:00:00Z", "2026-06-18T01:00:00Z"),
      order("completed", "2026-06-18T00:00:00Z", "2026-06-18T01:00:00Z"),
      order("cancelled", "2026-06-18T00:00:00Z", "2026-06-18T00:30:00Z"),
      order("assigned", "2026-06-18T00:00:00Z", "2026-06-18T00:10:00Z"),
      order("in_transit", "2026-06-18T00:00:00Z", "2026-06-18T00:20:00Z"),
    ];
    expect(computeKpis(orders)).toEqual({ total: 5, completed: 2, cancelled: 1, active: 2, successRate: 2 / 3 });
  });

  it("returns successRate 0 when no completed or cancelled orders", () => {
    expect(computeKpis([order("created", "x", "x")]).successRate).toBe(0);
  });
});

describe("deliveriesPerDay", () => {
  it("buckets completed orders by updatedAt day, oldest-first, zero-filled", () => {
    const now = Date.parse("2026-06-18T12:00:00Z");
    const orders = [
      order("completed", "2026-06-17T00:00:00Z", "2026-06-17T05:00:00Z"),
      order("completed", "2026-06-18T00:00:00Z", "2026-06-18T05:00:00Z"),
      order("completed", "2026-06-18T00:00:00Z", "2026-06-18T09:00:00Z"),
      order("cancelled", "2026-06-18T00:00:00Z", "2026-06-18T05:00:00Z"),
    ];
    const result = deliveriesPerDay(orders, 3, now);
    expect(result).toEqual([
      { date: "2026-06-16", count: 0 },
      { date: "2026-06-17", count: 1 },
      { date: "2026-06-18", count: 2 },
    ]);
  });
});

describe("avgLeadTimeMinutes", () => {
  it("averages updatedAt-createdAt over completed orders in whole minutes", () => {
    const orders = [
      order("completed", "2026-06-18T00:00:00Z", "2026-06-18T01:00:00Z"), // 60 min
      order("completed", "2026-06-18T00:00:00Z", "2026-06-18T00:30:00Z"), // 30 min
      order("cancelled", "2026-06-18T00:00:00Z", "2026-06-18T10:00:00Z"), // ignored
    ];
    expect(avgLeadTimeMinutes(orders)).toBe(45);
  });

  it("returns null when there are no completed orders", () => {
    expect(avgLeadTimeMinutes([order("created", "x", "x")])).toBeNull();
  });
});
