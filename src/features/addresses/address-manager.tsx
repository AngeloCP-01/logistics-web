import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Pencil, Trash2 } from "lucide-react";
import { useAddresses } from "./use-addresses";
import { useCreateAddress } from "./use-create-address";
import { useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from "./use-address-mutations";
import { addressSchema, toCreateAddressRequest, type AddressFormValues } from "./address-schema";
import type { Address } from "./types";
import { formatAddressLabel } from "@/shared/lib/format";
import { ApiError } from "@/shared/api/api-error";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

const FIELDS: { name: keyof AddressFormValues; label: string }[] = [
  { name: "label", label: "Label" },
  { name: "street", label: "Street" },
  { name: "city", label: "City" },
  { name: "country", label: "Country (2-letter)" },
  { name: "lat", label: "Latitude" },
  { name: "lng", label: "Longitude" },
];

function AddressForm({ initial, onSubmit, submitting, submitLabel, onCancel }: {
  initial?: Address;
  onSubmit: (v: AddressFormValues) => void;
  submitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    ...(initial
      ? { defaultValues: { label: initial.label, street: initial.street, city: initial.city, country: initial.country, lat: String(initial.lat), lng: String(initial.lng) } }
      : {}),
  });
  return (
    <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit(onSubmit)}>
      {FIELDS.map((f) => (
        <div key={f.name} className="space-y-1">
          <Label htmlFor={`addr-${f.name}`}>{f.label}</Label>
          <Input id={`addr-${f.name}`} {...register(f.name)} />
          {errors[f.name] && <p className="text-xs text-rose-700">{errors[f.name]?.message}</p>}
        </div>
      ))}
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

export function AddressManager({ defaultAddressId }: { defaultAddressId: string | null }) {
  const { data: addresses, isLoading, isError } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const del = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const onDelete = (a: Address) =>
    del.mutate(a.id, {
      onError: (e) => toast.error(e instanceof ApiError && e.status === 409 ? "Can't delete the default address." : "Could not delete the address."),
    });

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Saved addresses</h2>
        {!adding && <Button size="sm" variant="outline" onClick={() => setAdding(true)}>Add address</Button>}
      </div>

      {adding && (
        <AddressForm
          submitLabel={create.isPending ? "Saving…" : "Save address"}
          submitting={create.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={(v) => create.mutate(toCreateAddressRequest(v), { onSuccess: () => setAdding(false), onError: () => toast.error("Could not add the address.") })}
        />
      )}

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load addresses.</p>
      ) : (addresses ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
      ) : (
        <ul className="space-y-3">
          {(addresses ?? []).map((a) => {
            const isDefault = a.id === defaultAddressId;
            return (
              <li key={a.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-medium">{formatAddressLabel(a)}</span>
                    {isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isDefault && (
                      <Button size="sm" variant="ghost" aria-label={`Set default for ${a.label}`} disabled={setDefault.isPending} onClick={() => setDefault.mutate(a.id)}>
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" aria-label={`Edit ${a.label}`} onClick={() => setEditing(editing === a.id ? null : a.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${a.label}`} disabled={isDefault || del.isPending} onClick={() => onDelete(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {isDefault && <p className="text-xs text-muted-foreground">The default address can't be deleted. Set another default first.</p>}
                {editing === a.id && (
                  <AddressForm
                    initial={a}
                    submitLabel={update.isPending ? "Saving…" : "Save changes"}
                    submitting={update.isPending}
                    onCancel={() => setEditing(null)}
                    onSubmit={(v) => update.mutate({ id: a.id, input: toCreateAddressRequest(v) }, { onSuccess: () => setEditing(null), onError: () => toast.error("Could not update the address.") })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
