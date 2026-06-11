import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { usePlaceOrder } from "./use-place-order";
import { useCancelOrder } from "./use-cancel-order";

function order(id: string, status: string) {
  return { id, customerId: "u1", status, pickup: {}, dropoff: {}, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "x", updatedAt: "x" };
}

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

describe("usePlaceOrder", () => {
  it("POSTs the create body and resolves to the new order", async () => {
    let body: unknown;
    server.use(http.post("/api/orders", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(order("oNew", "created"), { status: 201 });
    }));
    const { result } = renderHook(() => usePlaceOrder(), { wrapper: QueryWrapper });
    const created = await result.current.mutateAsync({
      pickup: { street: "1 A St", city: "Manila", country: "PH", lat: 14, lng: 121 },
      dropoffAddressId: "a1",
      items: [{ description: "Box", quantity: 1 }],
    });
    expect(created.id).toBe("oNew");
    expect(body).toMatchObject({ dropoffAddressId: "a1", items: [{ description: "Box", quantity: 1 }] });
  });

  it("surfaces an ApiError on a 422", async () => {
    server.use(http.post("/api/orders", () =>
      HttpResponse.json({ title: "Address not found", status: 422 }, { status: 422 })));
    const { result } = renderHook(() => usePlaceOrder(), { wrapper: QueryWrapper });
    await expect(result.current.mutateAsync({
      pickup: { street: "x", city: "y", country: "PH", lat: 1, lng: 2 },
      dropoffAddressId: "missing",
      items: [{ description: "a", quantity: 1 }],
    })).rejects.toMatchObject({ status: 422 });
  });
});

describe("useCancelOrder", () => {
  it("POSTs to /cancel with a reason and resolves to the cancelled order", async () => {
    let body: unknown;
    server.use(http.post("/api/orders/o1/cancel", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(order("o1", "cancelled"));
    }));
    const { result } = renderHook(() => useCancelOrder(), { wrapper: QueryWrapper });
    const cancelled = await result.current.mutateAsync({ id: "o1", reason: "changed mind" });
    expect(cancelled.status).toBe("cancelled");
    expect(body).toEqual({ reason: "changed mind" });
  });

  it("sends an empty body when no reason is given", async () => {
    let body: unknown;
    server.use(http.post("/api/orders/o2/cancel", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(order("o2", "cancelled"));
    }));
    const { result } = renderHook(() => useCancelOrder(), { wrapper: QueryWrapper });
    await result.current.mutateAsync({ id: "o2" });
    expect(body).toEqual({});
  });
});
