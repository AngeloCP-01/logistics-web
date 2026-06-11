import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./logout";

function mockRes() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string | string[]>,
    status(c: number) { this.statusCode = c; return this; },
    json() { return this; },
    send() { return this; },
    setHeader(k: string, v: string | string[]) { this.headers[k] = v; },
    end() { return this; },
  };
}
beforeEach(() => { process.env.GATEWAY_URL = "https://gw.test"; });

describe("POST /api/auth/logout", () => {
  it("revokes at the gateway and clears the cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const req = { method: "POST", headers: { cookie: "rt=ref" } } as never;
    const res = mockRes();

    await handler(req, res as never);

    expect(fetchMock).toHaveBeenCalledWith("https://gw.test/v1/auth/logout", expect.objectContaining({ method: "POST" }));
    expect(res.statusCode).toBe(204);
    expect(String(res.headers["Set-Cookie"])).toContain("Max-Age=0");
  });

  it("still clears the cookie when there is no session", async () => {
    const req = { method: "POST", headers: {} } as never;
    const res = mockRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(204);
    expect(String(res.headers["Set-Cookie"])).toContain("Max-Age=0");
  });
});
