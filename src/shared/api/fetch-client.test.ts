import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFetchClient } from "./fetch-client";
import { useAuthStore } from "@/features/auth/auth-store";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("fetchClient", () => {
  beforeEach(() => useAuthStore.getState().clear());

  it("injects the bearer token and returns parsed JSON", async () => {
    useAuthStore.getState().setSession("tok-1", { id: "u1", email: "a@b.com", role: "customer" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    const client = createFetchClient({ baseUrl: "/api", fetchImpl, refresh: vi.fn() });

    const data = await client<{ ok: boolean }>("/orders");

    expect(data).toEqual({ ok: true });
    const headers = (fetchImpl.mock.calls[0]![1] as RequestInit).headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer tok-1");
  });

  it("on 401 refreshes once then retries and succeeds", async () => {
    useAuthStore.getState().setSession("stale", { id: "u1", email: "a@b.com", role: "customer" });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { title: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const refresh = vi.fn().mockImplementation(async () => {
      useAuthStore.getState().setAccessToken("fresh");
    });
    const client = createFetchClient({ baseUrl: "/api", fetchImpl, refresh });

    const data = await client<{ ok: boolean }>("/orders");

    expect(data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    const retryHeaders = (fetchImpl.mock.calls[1]![1] as RequestInit).headers as Headers;
    expect(retryHeaders.get("authorization")).toBe("Bearer fresh");
  });

  it("shares one refresh across concurrent 401s (single-flight)", async () => {
    useAuthStore.getState().setSession("stale", { id: "u1", email: "a@b.com", role: "customer" });
    const fetchImpl = vi.fn().mockImplementation(async (url: string) => {
      return useAuthStore.getState().accessToken === "fresh"
        ? jsonResponse(200, { url })
        : jsonResponse(401, { title: "expired" });
    });
    let refreshCalls = 0;
    const refresh = vi.fn().mockImplementation(async () => {
      refreshCalls++;
      await new Promise((r) => setTimeout(r, 5));
      useAuthStore.getState().setAccessToken("fresh");
    });
    const client = createFetchClient({ baseUrl: "/api", fetchImpl, refresh });

    await Promise.all([client("/a"), client("/b"), client("/c")]);

    expect(refreshCalls).toBe(1);
  });

  it("throws ApiError when refresh fails", async () => {
    useAuthStore.getState().setSession("stale", { id: "u1", email: "a@b.com", role: "customer" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(401, { title: "expired" }));
    const refresh = vi.fn().mockRejectedValue(new Error("no session"));
    const client = createFetchClient({ baseUrl: "/api", fetchImpl, refresh });

    await expect(client("/orders")).rejects.toMatchObject({ status: 401 });
  });
});
