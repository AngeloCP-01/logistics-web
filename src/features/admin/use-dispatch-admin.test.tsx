import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import type { ApiError } from "@/shared/api/api-error";
import { useAvailableDrivers, useForceAssign } from "./use-dispatch-admin";

const DRIVER = { driverId: "d1", displayName: "Dan", vehicleType: "car", availableSince: "2026-06-18T00:00:00Z" };

describe("useAvailableDrivers", () => {
  it("returns the available drivers", async () => {
    server.use(http.get("/api/dispatch/drivers/available", () => HttpResponse.json({ items: [DRIVER] })));
    const { result } = renderHook(() => useAvailableDrivers(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0]?.displayName).toBe("Dan");
  });
});

describe("useForceAssign", () => {
  it("POSTs the driverId and resolves on 204", async () => {
    let body: unknown;
    server.use(http.post("/api/dispatch/assignments/o1/force-assign", async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 204 }); }));
    const { result } = renderHook(() => useForceAssign(), { wrapper: QueryWrapper });
    result.current.mutate({ orderId: "o1", driverId: "d1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ driverId: "d1" });
  });

  it("surfaces a 409 conflict", async () => {
    server.use(http.post("/api/dispatch/assignments/o1/force-assign", () => HttpResponse.json({ title: "Already assigned", status: 409 }, { status: 409 })));
    const { result } = renderHook(() => useForceAssign(), { wrapper: QueryWrapper });
    result.current.mutate({ orderId: "o1", driverId: "d1" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(409);
  });
});
