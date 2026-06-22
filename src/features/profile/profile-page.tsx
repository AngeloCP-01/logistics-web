import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMyProfile } from "@/features/driver/use-my-profile";
import { useUpdateProfile } from "./use-update-profile";
import { AddressManager } from "@/features/addresses/address-manager";
import type { UpdateProfileRequest } from "./types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

const schema = z.object({
  displayName: z.string().min(1, "Required").max(80),
  phone: z.string().max(20).refine((s) => s === "" || s.length >= 7, "At least 7 characters"),
});
type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const profile = useMyProfile();
  const update = useUpdateProfile();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", phone: "" },
  });

  useEffect(() => {
    if (profile.data) reset({ displayName: profile.data.displayName, phone: profile.data.phone ?? "" });
  }, [profile.data, reset]);

  if (profile.isLoading) {
    return <div className="mx-auto max-w-2xl space-y-3 p-8"><Skeleton className="h-8 w-40" /><Skeleton className="h-40 w-full" /></div>;
  }
  if (profile.error || !profile.data) {
    return <div className="mx-auto max-w-2xl p-8"><p className="text-sm text-destructive">Could not load your profile.</p></div>;
  }

  const onSubmit = (v: FormValues) => {
    const input: UpdateProfileRequest = { displayName: v.displayName, phone: v.phone === "" ? null : v.phone };
    update.mutate(input, { onSuccess: () => toast.success("Profile saved."), onError: () => toast.error("Could not save your profile.") });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card className="space-y-4 p-4">
        <h2 className="font-medium">Your details</h2>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" {...register("displayName")} />
            {errors.displayName && <p className="text-xs text-rose-700">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-xs text-rose-700">{errors.phone.message}</p>}
          </div>
          <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save profile"}</Button>
        </form>
      </Card>

      <AddressManager defaultAddressId={profile.data.defaultAddressId} />
    </div>
  );
}
