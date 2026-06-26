import { describe, it, expect } from "vitest";
import { placeOrderSchema, toCreateOrderRequest, type PlaceOrderValues } from "./order-schema";

const valid: PlaceOrderValues = {
  pickup: { label: "Warehouse", street: "1 A St", city: "Manila", country: "ph", lat: "14.6", lng: "121" },
  dropoffAddressId: "a1",
  items: [{ description: "Box", quantity: "2", weightKg: "" }],
  scheduledFor: "",
};

describe("placeOrderSchema", () => {
  it("accepts a valid form", () => {
    expect(placeOrderSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a non-2-letter country", () => {
    expect(placeOrderSchema.safeParse({ ...valid, pickup: { ...valid.pickup, country: "PHL" } }).success).toBe(false);
  });
  it("rejects an out-of-range latitude", () => {
    expect(placeOrderSchema.safeParse({ ...valid, pickup: { ...valid.pickup, lat: "200" } }).success).toBe(false);
  });
  it("rejects a quantity below 1", () => {
    expect(placeOrderSchema.safeParse({ ...valid, items: [{ description: "x", quantity: "0", weightKg: "" }] }).success).toBe(false);
  });
  it("rejects a past scheduledFor", () => {
    expect(placeOrderSchema.safeParse({ ...valid, scheduledFor: "2000-01-01T00:00" }).success).toBe(false);
  });
});

describe("toCreateOrderRequest", () => {
  it("converts strings to the numeric API shape, omitting empty optionals", () => {
    const req = toCreateOrderRequest(valid);
    expect(req).toEqual({
      pickup: { label: "Warehouse", street: "1 A St", city: "Manila", country: "PH", lat: 14.6, lng: 121 },
      dropoffAddressId: "a1",
      items: [{ description: "Box", quantity: 2 }],
    });
  });
  it("includes weightKg and scheduledFor when present", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    const req = toCreateOrderRequest({ ...valid, items: [{ description: "Box", quantity: "1", weightKg: "3.5" }], scheduledFor: future });
    expect(req.items[0]).toEqual({ description: "Box", quantity: 1, weightKg: 3.5 });
    expect(typeof req.scheduledFor).toBe("string");
    expect(req.scheduledFor!.endsWith("Z")).toBe(true);
  });
});

const PICKUP = { label: "", street: "1 A St", city: "Manila", country: "ph", lat: "14.5574", lng: "121.0089" };
const BASE = { pickup: PICKUP, dropoffAddressId: "a1", items: [{ description: "x", quantity: "1", weightKg: "" }], scheduledFor: "" };

describe("placeOrderSchema pickup coordinates", () => {
  it("accepts a trailing degree sign on pickup coordinates", () => {
    const r = placeOrderSchema.safeParse({ ...BASE, pickup: { ...PICKUP, lat: "14.5574°", lng: "121.0089°" } });
    expect(r.success).toBe(true);
  });

  it("strips the degree sign when converting to the API request", () => {
    const req = toCreateOrderRequest({ ...BASE, pickup: { ...PICKUP, lat: "14.5574°", lng: "121.0089°" } });
    expect(req.pickup.lat).toBe(14.5574);
    expect(req.pickup.lng).toBe(121.0089);
  });
});
