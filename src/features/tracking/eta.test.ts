import { describe, it, expect } from "vitest";
import { haversineKm, etaMinutes } from "./eta";

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm({ lat: 14.6, lng: 121.0 }, { lat: 14.6, lng: 121.0 })).toBe(0);
  });

  it("computes a known one-degree-latitude distance (~111 km)", () => {
    const km = haversineKm({ lat: 14.0, lng: 121.0 }, { lat: 15.0, lng: 121.0 });
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });
});

describe("etaMinutes", () => {
  it("returns whole minutes at the assumed 30 km/h", () => {
    // ~111 km / 30 km/h = 3.70 h = 222 min (allow rounding slack)
    const mins = etaMinutes({ lat: 14.0, lng: 121.0 }, { lat: 15.0, lng: 121.0 });
    expect(mins).toBeGreaterThanOrEqual(220);
    expect(mins).toBeLessThanOrEqual(224);
  });

  it("is zero when already at the destination", () => {
    expect(etaMinutes({ lat: 14.6, lng: 121.0 }, { lat: 14.6, lng: 121.0 })).toBe(0);
  });
});
