import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./login";

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

describe("POST /api/auth/login", () => {
  it("sets the refresh cookie and returns only the access token + user", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "acc", refreshToken: "ref", expiresIn: 900, tokenType: "Bearer" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "u1", email: "a@b.com", role: "customer" }), { status: 200 })));
    const req = { method: "POST", body: { email: "a@b.com", password: "pw" } } as never;
    const res = mockRes();

    await handler(req, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ accessToken: "acc", user: { id: "u1", role: "customer" } });
    expect(res.body).not.toHaveProperty("refreshToken");
    expect(String(res.headers["Set-Cookie"])).toContain("rt=ref");
    expect(String(res.headers["Set-Cookie"])).toContain("HttpOnly");
  });

  it("passes through a 401 from the gateway without a cookie", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ title: "Invalid credentials", status: 401 }), { status: 401 })));
    const req = { method: "POST", body: { email: "a@b.com", password: "bad" } } as never;
    const res = mockRes();

    await handler(req, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.headers["Set-Cookie"]).toBeUndefined();
  });

  it("rejects non-POST", async () => {
    const req = { method: "GET" } as never;
    const res = mockRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(405);
  });
});
