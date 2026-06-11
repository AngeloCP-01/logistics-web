import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { useAuthStore } from "./auth-store";
import { bootstrapSession, refreshSession, loginRequest, logoutRequest } from "./session";

beforeEach(() => useAuthStore.getState().clear());

describe("session", () => {
  it("bootstrapSession restores the store from a successful refresh", async () => {
    server.use(http.post("/api/auth/refresh", () =>
      HttpResponse.json({ accessToken: "acc", user: { id: "u1", email: "a@b.com", role: "customer" } })));

    const ok = await bootstrapSession();

    expect(ok).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("acc");
    expect(useAuthStore.getState().user?.role).toBe("customer");
  });

  it("bootstrapSession returns false and leaves the store empty on 401", async () => {
    server.use(http.post("/api/auth/refresh", () => new HttpResponse(null, { status: 401 })));
    const ok = await bootstrapSession();
    expect(ok).toBe(false);
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("refreshSession throws when the BFF refuses (so fetch-client can bounce to login)", async () => {
    server.use(http.post("/api/auth/refresh", () => new HttpResponse(null, { status: 401 })));
    await expect(refreshSession()).rejects.toThrow();
  });

  it("loginRequest stores the session", async () => {
    server.use(http.post("/api/auth/login", () =>
      HttpResponse.json({ accessToken: "acc", user: { id: "u1", email: "a@b.com", role: "admin" } })));
    await loginRequest({ email: "a@b.com", password: "pw" });
    expect(useAuthStore.getState().user?.role).toBe("admin");
  });

  it("logoutRequest clears the store", async () => {
    useAuthStore.getState().setSession("acc", { id: "u1", email: "a@b.com", role: "admin" });
    server.use(http.post("/api/auth/logout", () => new HttpResponse(null, { status: 204 })));
    await logoutRequest();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("logoutRequest still clears the store when the network call fails", async () => {
    useAuthStore.getState().setSession("acc", { id: "u1", email: "a@b.com", role: "admin" });
    server.use(http.post("/api/auth/logout", () => HttpResponse.error()));
    // The transport rejects on a network error; the `finally` must still clear the store.
    await logoutRequest().catch(() => undefined);
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("loginRequest rejects with an ApiError carrying the problem status on a bad login", async () => {
    server.use(http.post("/api/auth/login", () =>
      HttpResponse.json({ title: "Invalid credentials", status: 401 }, { status: 401 })));
    await expect(loginRequest({ email: "a@b.com", password: "bad" })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
