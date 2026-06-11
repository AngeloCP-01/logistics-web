import { z } from "zod";
import type { CreateAddressRequest } from "./types";

function coordString(min: number, max: number) {
  return z.string().min(1, "Required").refine((s) => {
    const n = Number(s);
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
    lat: Number(v.lat),
    lng: Number(v.lng),
  };
}
