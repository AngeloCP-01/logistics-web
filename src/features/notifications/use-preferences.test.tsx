import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { usePreferences, useUpdatePreferences } from "./use-preferences";

describe("usePreferences", () => {
  it("returns the preferences", async () => {
    server.use(http.get("/api/notifications/preferences", () => HttpResponse.json({ emailEnabled: true })));
    const { result } = renderHook(() => usePreferences(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.emailEnabled).toBe(true);
  });
});

describe("useUpdatePreferences", () => {
  it("PUTs the new preferences", async () => {
    let body: unknown;
    server.use(http.put("/api/notifications/preferences", async ({ request }) => { body = await request.json(); return HttpResponse.json({ emailEnabled: false }); }));
    const { result } = renderHook(() => useUpdatePreferences(), { wrapper: QueryWrapper });
    result.current.mutate({ emailEnabled: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ emailEnabled: false });
  });
});
