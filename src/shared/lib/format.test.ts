import { describe, it, expect } from "vitest";
import { formatAddress, formatDateTime } from "./format";

describe("format helpers", () => {
  it("formats an address as a single line", () => {
    expect(formatAddress({ label: "Home", street: "12 Mabini St", city: "Manila", country: "PH", lat: 14.6, lng: 121 }))
      .toBe("12 Mabini St, Manila, PH");
  });

  it("omits a missing label cleanly", () => {
    expect(formatAddress({ street: "1 A St", city: "Cebu", country: "PH", lat: 10, lng: 123 }))
      .toBe("1 A St, Cebu, PH");
  });

  it("formats an ISO datetime to a readable local string", () => {
    const out = formatDateTime("2026-06-11T08:30:00.000Z");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toContain("Invalid");
  });

  it("returns an em dash for a null datetime", () => {
    expect(formatDateTime(null)).toBe("—");
  });
});
