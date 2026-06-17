import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useRouteSeed, useLatestSeed } from "./use-tracking-seed";

const POINT = { orderId: "o1", lat: 14.6, lng: 121.0, ts: "2026-06-17T00:00:00Z" };

describe("useRouteSeed", () => {
  it("returns the breadcrumb items", async () => {
    server.use(
      http.get("/api/tracking/orders/o1/route", () =>
        HttpResponse.json({ items: [POINT], nextCursor: null }),
      ),
    );
    const { result } = renderHook(() => useRouteSeed("o1"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });

  it("treats a 404 as an empty breadcrumb", async () => {
    server.use(
      http.get("/api/tracking/orders/o1/route", () =>
        HttpResponse.json({ title: "Not found", status: 404 }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useRouteSeed("o1"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ items: [], nextCursor: null });
  });
});

describe("useLatestSeed", () => {
  it("returns the last-known point", async () => {
    server.use(http.get("/api/tracking/orders/o1/latest", () => HttpResponse.json(POINT)));
    const { result } = renderHook(() => useLatestSeed("o1"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(POINT);
  });

  it("treats a 404 as no point yet", async () => {
    server.use(
      http.get("/api/tracking/orders/o1/latest", () =>
        HttpResponse.json({ title: "Not found", status: 404 }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useLatestSeed("o1"), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
