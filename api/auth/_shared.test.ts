import { describe, it, expect } from "vitest";
import { buildSetCookie, clearCookie, readRefreshCookie, REFRESH_COOKIE } from "./_shared";

describe("bff cookie helpers", () => {
  it("builds an httpOnly, secure, path-scoped cookie", () => {
    const c = buildSetCookie("rt-value");
    expect(c).toContain(`${REFRESH_COOKIE}=rt-value`);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("Secure");
    expect(c).toContain("SameSite=Lax");
    expect(c).toContain("Path=/api/auth");
    expect(c).toContain("Max-Age=2592000");
  });

  it("clears the cookie with Max-Age=0", () => {
    expect(clearCookie()).toContain("Max-Age=0");
  });

  it("reads the refresh token from a cookie header", () => {
    expect(readRefreshCookie(`other=1; ${REFRESH_COOKIE}=abc; x=2`)).toBe("abc");
    expect(readRefreshCookie(undefined)).toBeNull();
  });
});
