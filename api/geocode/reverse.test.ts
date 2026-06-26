import { describe, it, expect, vi, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./reverse";

function mockRes() {
  const res = { statusCode: 0, body: undefined as unknown };
  const r = {
    status(code: number) { res.statusCode = code; return r; },
    json(body: unknown) { res.body = body; return r; },
  } as unknown as VercelResponse;
  return { r, res };
}

function req(url: string): VercelRequest {
  return { method: "GET", url } as unknown as VercelRequest;
}

afterEach(() => vi.restoreAllMocks());

describe("GET /api/geocode/reverse", () => {
  it("returns 200 with the mapped location", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ address: { road: "Dela Rosa", city: "Makati", country_code: "ph" } }), { status: 200 }),
    );
    const { r, res } = mockRes();
    await handler(req("/api/geocode/reverse?lat=14.5574&lng=121.0089"), r);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ lat: 14.5574, lng: 121.0089, street: "Dela Rosa", city: "Makati", country: "PH" });
  });

  it("returns 400 for out-of-range coordinates", async () => {
    const { r, res } = mockRes();
    await handler(req("/api/geocode/reverse?lat=999&lng=0"), r);
    expect(res.statusCode).toBe(400);
  });

  it("returns 502 when the provider fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));
    const { r, res } = mockRes();
    await handler(req("/api/geocode/reverse?lat=14.5&lng=121"), r);
    expect(res.statusCode).toBe(502);
  });
});
