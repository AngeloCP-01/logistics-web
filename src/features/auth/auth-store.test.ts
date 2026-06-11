import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth-store";

describe("auth-store", () => {
  beforeEach(() => useAuthStore.getState().clear());

  it("starts unauthenticated", () => {
    const s = useAuthStore.getState();
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated()).toBe(false);
  });

  it("stores a session and reports authenticated", () => {
    useAuthStore.getState().setSession("tok-123", { id: "u1", email: "a@b.com", role: "customer" });
    const s = useAuthStore.getState();
    expect(s.accessToken).toBe("tok-123");
    expect(s.user?.role).toBe("customer");
    expect(s.isAuthenticated()).toBe(true);
  });

  it("clears the session", () => {
    useAuthStore.getState().setSession("tok", { id: "u1", email: "a@b.com", role: "admin" });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
