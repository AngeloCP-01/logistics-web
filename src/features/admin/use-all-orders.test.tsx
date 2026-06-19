import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAllOrders } from "./use-all-orders";

function order(id: string) {
  return { id, customerId: "c1", status: "completed", pickup: { street: "1", city: "M", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "2", city: "C", country: "PH", lat: 1, lng: 2 }, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };
}

describe("useAllOrders", () => {
  it("accumulates across cursor pages until nextCursor is null", async () => {
    server.use(
      http.get("/api/orders", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        if (!cursor) return HttpResponse.json({ items: [order("o1"), order("o2")], nextCursor: "c2" });
        return HttpResponse.json({ items: [order("o3")], nextCursor: null });
      }),
    );
    const { result } = renderHook(() => useAllOrders(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((o) => o.id)).toEqual(["o1", "o2", "o3"]);
  });
});
