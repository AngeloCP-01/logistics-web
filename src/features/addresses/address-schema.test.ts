import { describe, it, expect } from "vitest";
import { addressSchema, toCreateAddressRequest } from "./address-schema";

const BASE = { label: "Home", street: "12 Mabini", city: "Manila", country: "ph" };

describe("addressSchema coordinate validation", () => {
  it("accepts plain numeric coordinates", () => {
    const r = addressSchema.safeParse({ ...BASE, lat: "14.5574", lng: "121.0089" });
    expect(r.success).toBe(true);
  });

  it("accepts coordinates with a trailing degree sign (as pasted from map apps)", () => {
    const r = addressSchema.safeParse({ ...BASE, lat: "14.5574°", lng: "121.0089°" });
    expect(r.success).toBe(true);
  });

  it("accepts a degree sign with surrounding whitespace", () => {
    const r = addressSchema.safeParse({ ...BASE, lat: " 14.5574° ", lng: "121.0089 °" });
    expect(r.success).toBe(true);
  });

  it("rejects latitude outside -90…90", () => {
    const r = addressSchema.safeParse({ ...BASE, lat: "91", lng: "0" });
    expect(r.success).toBe(false);
  });

  it("rejects longitude outside -180…180", () => {
    const r = addressSchema.safeParse({ ...BASE, lat: "0", lng: "181" });
    expect(r.success).toBe(false);
  });

  it("rejects non-numeric coordinates", () => {
    const r = addressSchema.safeParse({ ...BASE, lat: "north", lng: "0" });
    expect(r.success).toBe(false);
  });
});

describe("toCreateAddressRequest", () => {
  it("converts string form values to the numeric API shape and uppercases the country", () => {
    const req = toCreateAddressRequest({ ...BASE, lat: "14.5574", lng: "121.0089" });
    expect(req).toEqual({ label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.5574, lng: 121.0089 });
  });

  it("strips a trailing degree sign when converting to numbers", () => {
    const req = toCreateAddressRequest({ ...BASE, lat: "14.5574°", lng: "121.0089°" });
    expect(req.lat).toBe(14.5574);
    expect(req.lng).toBe(121.0089);
  });
});
