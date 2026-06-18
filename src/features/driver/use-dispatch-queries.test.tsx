import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useCurrentOffer, useAssignment } from "./use-dispatch-queries";

const OFFER = {
  orderId: "o1", offerAttempts: 1, expiresAt: "2026-06-18T12:00:00Z",
  order: { pickup: { street: "1 A", city: "M", country: "PH", lat: 14.5, lng: 121 }, dropoff: { street: "2 B", city: "M", country: "PH", lat: 14.6, lng: 121.05 }, items: [{ description: "Box", quantity: 1, weightKg: null }] },
};
const ASSIGNMENT = { orderId: "o1", status: "assigned", assignedDriverId: "u1", offerAttempts: 1, order: OFFER.order };

describe("useCurrentOffer", () => {
  it("returns the current offer", async () => {
    server.use(http.get("/api/dispatch/offers/current", () => HttpResponse.json(OFFER)));
    const { result } = renderHook(() => useCurrentOffer(true), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.orderId).toBe("o1");
  });

  it("returns null on a 204 (no outstanding offer)", async () => {
    server.use(http.get("/api/dispatch/offers/current", () => new HttpResponse(null, { status: 204 })));
    const { result } = renderHook(() => useCurrentOffer(true), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when disabled", async () => {
    const { result } = renderHook(() => useCurrentOffer(false), { wrapper: QueryWrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAssignment", () => {
  it("returns the assignment with its order summary", async () => {
    server.use(http.get("/api/dispatch/assignments/o1", () => HttpResponse.json(ASSIGNMENT)));
    const { result } = renderHook(() => useAssignment("o1"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.order.dropoff.city).toBe("M");
  });
});
