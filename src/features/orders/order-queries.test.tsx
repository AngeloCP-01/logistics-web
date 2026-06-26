import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { useMyOrders } from "./use-my-orders";
import { useOrder, orderPollInterval } from "./use-order";
import { useActiveOrder } from "./use-active-order";

function order(id: string, status: string) {
  return { id, customerId: "u1", status, pickup: {}, dropoff: {}, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-11T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" };
}

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

describe("orderPollInterval", () => {
  it("polls every 5s while the order is non-terminal (so a driver pickup updates the page live)", () => {
    expect(orderPollInterval(undefined)).toBe(5000);
    expect(orderPollInterval("created")).toBe(5000);
    expect(orderPollInterval("assigned")).toBe(5000);
    expect(orderPollInterval("in_transit")).toBe(5000);
  });

  it("stops polling once the order is terminal", () => {
    expect(orderPollInterval("completed")).toBe(false);
    expect(orderPollInterval("cancelled")).toBe(false);
  });
});

describe("useMyOrders", () => {
  it("passes the status filter and returns the first page", async () => {
    let url: URL | null = null;
    server.use(http.get("/api/orders/me", ({ request }) => {
      url = new URL(request.url);
      return HttpResponse.json({ items: [order("o1", "created")], nextCursor: "cur2" });
    }));
    const { result } = renderHook(() => useMyOrders("created"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]!.items).toHaveLength(1);
    expect(url!.searchParams.get("status")).toBe("created");
    expect(result.current.hasNextPage).toBe(true);
  });

  it("omits the status param when 'all'", async () => {
    let url: URL | null = null;
    server.use(http.get("/api/orders/me", ({ request }) => {
      url = new URL(request.url);
      return HttpResponse.json({ items: [], nextCursor: null });
    }));
    const { result } = renderHook(() => useMyOrders("all"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url!.searchParams.has("status")).toBe(false);
  });
});

describe("useOrder", () => {
  it("fetches a single order by id", async () => {
    server.use(http.get("/api/orders/o9", () => HttpResponse.json(order("o9", "assigned"))));
    const { result } = renderHook(() => useOrder("o9"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("assigned");
  });
});

describe("useActiveOrder", () => {
  it("prefers an in_transit order", async () => {
    server.use(http.get("/api/orders/me", ({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      return HttpResponse.json({ items: status === "in_transit" ? [order("oT", "in_transit")] : [], nextCursor: null });
    }));
    const { result } = renderHook(() => useActiveOrder(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("oT");
  });

  it("falls back to an assigned order, else null", async () => {
    server.use(http.get("/api/orders/me", ({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      return HttpResponse.json({ items: status === "assigned" ? [order("oA", "assigned")] : [], nextCursor: null });
    }));
    const { result } = renderHook(() => useActiveOrder(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("oA");
  });
});
