import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAdminOrders, useAdminOrder, useUnassignedOrders } from "./use-admin-orders";

function order(id: string, status = "created") {
  return { id, customerId: "c1", status, pickup: { street: "1 A", city: "Manila", country: "PH", lat: 14.5, lng: 121 }, dropoff: { street: "2 B", city: "Cebu", country: "PH", lat: 14.6, lng: 121.05 }, items: [{ description: "Box", quantity: 1, weightKg: null }], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };
}

describe("useAdminOrders", () => {
  it("lists all orders with no status filter", async () => {
    server.use(http.get("/api/orders", () => HttpResponse.json({ items: [order("o1"), order("o2")], nextCursor: null })));
    const { result } = renderHook(() => useAdminOrders("all"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items).toHaveLength(2);
  });

  it("passes the status filter to the query", async () => {
    let url = "";
    server.use(http.get("/api/orders", ({ request }) => { url = request.url; return HttpResponse.json({ items: [order("o1", "completed")], nextCursor: null }); }));
    const { result } = renderHook(() => useAdminOrders("completed"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url).toContain("status=completed");
  });
});

describe("useAdminOrder", () => {
  it("fetches a single order by id", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("o1", "assigned"))));
    const { result } = renderHook(() => useAdminOrder("o1"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("assigned");
  });
});

describe("useUnassignedOrders", () => {
  it("fetches created orders", async () => {
    let url = "";
    server.use(http.get("/api/orders", ({ request }) => { url = request.url; return HttpResponse.json({ items: [order("o1")], nextCursor: null }); }));
    const { result } = renderHook(() => useUnassignedOrders(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url).toContain("status=created");
    expect(result.current.data?.items).toHaveLength(1);
  });
});
