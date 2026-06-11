import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./refresh";

function mockRes() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string | string[]>,
    body: undefined as unknown,
    status(c: number) { this.statusCode = c; return this; },
    json(b: unknown) { this.body = b; return this; },
    setHeader(k: string, v: string | string[]) { this.headers[k] = v; },
  };
}
beforeEach(() => { process.env.GATEWAY_URL = "https://gw.test"; });

describe("POST /api/auth/refresh", () => {
  it("rotates the cookie and returns a fresh access token + user", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "acc2", refreshToken: "ref2", expiresIn: 900, tokenType: "Bearer" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "u1", email: "a@b.com", role: "driver" }), { status: 200 })));
    const req = { method: "POST", headers: { cookie: "rt=ref1" } } as never;
    const res = mockRes();

    await handler(req, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ accessToken: "acc2", user: { role: "driver" } });
    expect(String(res.headers["Set-Cookie"])).toContain("rt=ref2");
  });

  it("401s and clears the cookie when no refresh cookie present", async () => {
    const req = { method: "POST", headers: {} } as never;
    const res = mockRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(401);
    expect(String(res.headers["Set-Cookie"])).toContain("Max-Age=0");
  });

  it("401s and clears the cookie when the gateway rejects the refresh token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ title: "expired", status: 401 }), { status: 401 })));
    const req = { method: "POST", headers: { cookie: "rt=stale" } } as never;
    const res = mockRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(401);
    expect(String(res.headers["Set-Cookie"])).toContain("Max-Age=0");
  });
});
