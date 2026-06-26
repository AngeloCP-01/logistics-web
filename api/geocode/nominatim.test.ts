import { describe, it, expect, vi } from "vitest";
import { nominatimToAddress, reverseGeocode, BadCoordinatesError } from "./nominatim";

describe("nominatimToAddress", () => {
  it("maps a full address", () => {
    expect(nominatimToAddress({ house_number: "12", road: "Dela Rosa", city: "Makati", country_code: "ph" }))
      .toEqual({ street: "12 Dela Rosa", city: "Makati", country: "PH" });
  });

  it("falls back through city → town → village and road → neighbourhood", () => {
    expect(nominatimToAddress({ neighbourhood: "Poblacion", village: "San Isidro", country_code: "ph" }))
      .toEqual({ street: "Poblacion", city: "San Isidro", country: "PH" });
  });

  it("returns empty strings when fields are missing", () => {
    expect(nominatimToAddress(undefined)).toEqual({ street: "", city: "", country: "" });
  });
});

describe("reverseGeocode", () => {
  it("rejects out-of-range coordinates with BadCoordinatesError", async () => {
    await expect(reverseGeocode({ lat: 91, lng: 0 })).rejects.toBeInstanceOf(BadCoordinatesError);
    await expect(reverseGeocode({ lat: 0, lng: 181 })).rejects.toBeInstanceOf(BadCoordinatesError);
  });

  it("calls Nominatim and maps the response", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ address: { road: "Dela Rosa", city: "Makati", country_code: "ph" } }), { status: 200 }),
    ) as unknown as typeof fetch;
    const result = await reverseGeocode({ lat: 14.5574, lng: 121.0089 }, fetchImpl);
    expect(result).toEqual({ lat: 14.5574, lng: 121.0089, street: "Dela Rosa", city: "Makati", country: "PH" });
    const calledUrl = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("lat=14.5574");
    expect(calledUrl).toContain("lon=121.0089");
  });

  it("throws when Nominatim responds non-2xx", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
    await expect(reverseGeocode({ lat: 14.5, lng: 121 }, fetchImpl)).rejects.toThrow();
  });
});
