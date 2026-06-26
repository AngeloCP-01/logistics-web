import { z } from "zod";
import type { CreateAddressRequest } from "./types";

// Coordinates are commonly pasted from map apps with a trailing degree sign
// (e.g. "14.5574°"); tolerate it rather than rejecting a valid coordinate.
export function parseCoord(s: string): number {
  return Number(s.replace("°", "").trim());
}

function coordString(min: number, max: number) {
  return z.string().min(1, "Required").refine((s) => {
    const n = parseCoord(s);
    return Number.isFinite(n) && n >= min && n <= max;
  }, `Must be ${min}…${max}`);
}

export const addressSchema = z.object({
  label: z.string().min(1, "Required").max(40),
  street: z.string().min(1, "Required").max(200),
  city: z.string().min(1, "Required").max(80),
  country: z.string().regex(/^[A-Za-z]{2}$/, "2-letter ISO code"),
  lat: coordString(-90, 90),
  lng: coordString(-180, 180),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export function toCreateAddressRequest(v: AddressFormValues): CreateAddressRequest {
  return {
    label: v.label,
    street: v.street,
    city: v.city,
    country: v.country.toUpperCase(),
    lat: parseCoord(v.lat),
    lng: parseCoord(v.lng),
  };
}
