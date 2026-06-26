import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { parseCoord, placeOrderSchema, toCreateOrderRequest, type PlaceOrderValues } from "./order-schema";
import { usePlaceOrder } from "./use-place-order";
import { AddressPicker } from "@/features/addresses/address-picker";
import { LocationPicker } from "@/shared/location/location-picker";
import type { GeocodedLocation } from "@/shared/location/use-reverse-geocode";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const DEFAULTS: PlaceOrderValues = {
  pickup: { label: "", street: "", city: "", country: "", lat: "", lng: "" },
  dropoffAddressId: "",
  items: [{ description: "", quantity: "1", weightKg: "" }],
  scheduledFor: "",
};

export function PlaceOrderPage() {
  const navigate = useNavigate();
  const placeOrder = usePlaceOrder();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlaceOrderValues>({ resolver: zodResolver(placeOrderSchema), defaultValues: DEFAULTS });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const dropoffAddressId = watch("dropoffAddressId");
  const pickupLat = watch("pickup.lat");
  const pickupLng = watch("pickup.lng");
  const pickupPin = pickupLat && pickupLng ? { lat: parseCoord(pickupLat), lng: parseCoord(pickupLng) } : null;
  function applyPickupLocation(loc: GeocodedLocation) {
    setValue("pickup.lat", String(loc.lat), { shouldValidate: true });
    setValue("pickup.lng", String(loc.lng), { shouldValidate: true });
    if (loc.street) setValue("pickup.street", loc.street, { shouldValidate: true });
    if (loc.city) setValue("pickup.city", loc.city, { shouldValidate: true });
    if (loc.country) setValue("pickup.country", loc.country, { shouldValidate: true });
  }

  async function onSubmit(values: PlaceOrderValues) {
    setFormError(null);
    try {
      const order = await placeOrder.mutateAsync(toCreateOrderRequest(values));
      navigate(`/orders/${order.id}`);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.title : "Could not place order");
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Place an order</h1>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="space-y-3">
          <h2 className="font-medium">Pickup</h2>
          {([
            { name: "pickup.street", label: "Pickup street" },
            { name: "pickup.city", label: "Pickup city" },
            { name: "pickup.country", label: "Pickup country (2-letter)" },
          ] as const).map((f) => (
            <div key={f.name} className="space-y-1">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input id={f.name} {...register(f.name)} />
            </div>
          ))}
          <input type="hidden" {...register("pickup.lat")} />
          <input type="hidden" {...register("pickup.lng")} />
          <div className="space-y-1">
            <Label>Pickup location</Label>
            <LocationPicker value={pickupPin} onChange={applyPickupLocation} />
          </div>
          {(errors.pickup?.street || errors.pickup?.city || errors.pickup?.country || errors.pickup?.lat || errors.pickup?.lng) && (
            <p className="text-sm text-destructive">
              {errors.pickup?.street?.message ?? errors.pickup?.city?.message ?? errors.pickup?.country?.message ?? errors.pickup?.lat?.message ?? errors.pickup?.lng?.message}
            </p>
          )}
        </section>

        <section className="space-y-1">
          <h2 className="font-medium">Dropoff</h2>
          <AddressPicker
            value={dropoffAddressId}
            onChange={(id) => setValue("dropoffAddressId", id, { shouldValidate: true })}
            {...(errors.dropoffAddressId?.message ? { error: errors.dropoffAddressId.message } : {})}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Items</h2>
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_5rem_6rem_auto] items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor={`items.${i}.description`}>{`Item ${i + 1} description`}</Label>
                <Input id={`items.${i}.description`} {...register(`items.${i}.description`)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`items.${i}.quantity`}>Qty</Label>
                <Input id={`items.${i}.quantity`} {...register(`items.${i}.quantity`)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`items.${i}.weightKg`}>Weight kg</Label>
                <Input id={`items.${i}.weightKg`} {...register(`items.${i}.weightKg`)} />
              </div>
              <Button type="button" variant="outline" size="sm" disabled={fields.length === 1} onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          ))}
          {errors.items?.message && <p className="text-sm text-destructive">{errors.items.message}</p>}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: "1", weightKg: "" })}>
            Add item
          </Button>
        </section>

        <section className="space-y-1">
          <Label htmlFor="scheduledFor">Schedule for (optional)</Label>
          <Input id="scheduledFor" type="datetime-local" {...register("scheduledFor")} />
          {errors.scheduledFor && <p className="text-sm text-destructive">{errors.scheduledFor.message}</p>}
        </section>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={isSubmitting}>
          Place order
        </Button>
      </form>
    </div>
  );
}
