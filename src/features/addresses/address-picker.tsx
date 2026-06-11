import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddresses } from "./use-addresses";
import { useCreateAddress } from "./use-create-address";
import { addressSchema, toCreateAddressRequest, type AddressFormValues } from "./address-schema";
import { formatAddressLabel } from "@/shared/lib/format";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";

export function AddressPicker({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string }) {
  const { data: addresses, isLoading } = useAddresses();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <Label htmlFor="dropoffAddressId">Dropoff address</Label>
      <div className="flex gap-2">
        <select
          id="dropoffAddressId"
          aria-label="Dropoff address"
          className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {isLoading ? "Loading…" : "Select an address"}
          </option>
          {(addresses ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {formatAddressLabel(a)}
            </option>
          ))}
        </select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Add address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a saved address</DialogTitle>
            </DialogHeader>
            <AddAddressForm
              onCreated={(id) => {
                onChange(id);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function AddAddressForm({ onCreated }: { onCreated: (id: string) => void }) {
  const create = useCreateAddress();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });

  async function onSubmit(values: AddressFormValues) {
    setFormError(null);
    try {
      const created = await create.mutateAsync(toCreateAddressRequest(values));
      onCreated(created.id);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.title : "Could not save address");
    }
  }

  const fields: { name: keyof AddressFormValues; label: string }[] = [
    { name: "label", label: "Label" },
    { name: "street", label: "Street" },
    { name: "city", label: "City" },
    { name: "country", label: "Country (2-letter)" },
    { name: "lat", label: "Latitude" },
    { name: "lng", label: "Longitude" },
  ];

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <Label htmlFor={`addr-${f.name}`}>{f.label}</Label>
          <Input id={`addr-${f.name}`} {...register(f.name)} />
          {errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]?.message}</p>}
        </div>
      ))}
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Save address
      </Button>
    </form>
  );
}
