import { z } from "zod";
import type { CreateOrderRequest } from "./types";

// Coordinates can arrive with a trailing degree sign (e.g. "14.5574°", as set by
// the map picker or pasted from a map app); tolerate it rather than rejecting.
export function parseCoord(s: string): number {
  return Number(s.replace("°", "").trim());
}

function coordString(min: number, max: number) {
  return z.string().min(1, "Required").refine((s) => {
    const n = parseCoord(s);
    return Number.isFinite(n) && n >= min && n <= max;
  }, `Must be ${min}…${max}`);
}

export const placeOrderSchema = z
  .object({
    pickup: z.object({
      label: z.string().max(40),
      street: z.string().min(1, "Required").max(200),
      city: z.string().min(1, "Required").max(80),
      country: z.string().regex(/^[A-Za-z]{2}$/, "2-letter ISO code"),
      lat: coordString(-90, 90),
      lng: coordString(-180, 180),
    }),
    dropoffAddressId: z.string().min(1, "Select a dropoff address"),
    items: z
      .array(
        z.object({
          description: z.string().min(1, "Required"),
          quantity: z.string().refine((s) => Number.isInteger(Number(s)) && Number(s) >= 1, "Min 1"),
          weightKg: z.string().refine((s) => s === "" || (Number.isFinite(Number(s)) && Number(s) > 0), "Must be > 0"),
        }),
      )
      .min(1, "Add at least one item"),
    scheduledFor: z.string(),
  })
  .refine((v) => v.scheduledFor === "" || new Date(v.scheduledFor).getTime() > Date.now(), {
    path: ["scheduledFor"],
    message: "Must be in the future",
  });

export type PlaceOrderValues = z.infer<typeof placeOrderSchema>;

export function toCreateOrderRequest(v: PlaceOrderValues): CreateOrderRequest {
  return {
    pickup: {
      ...(v.pickup.label ? { label: v.pickup.label } : {}),
      street: v.pickup.street,
      city: v.pickup.city,
      country: v.pickup.country.toUpperCase(),
      lat: parseCoord(v.pickup.lat),
      lng: parseCoord(v.pickup.lng),
    },
    dropoffAddressId: v.dropoffAddressId,
    items: v.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      ...(i.weightKg ? { weightKg: Number(i.weightKg) } : {}),
    })),
    ...(v.scheduledFor ? { scheduledFor: new Date(v.scheduledFor).toISOString() } : {}),
  };
}
