import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateDriverProfile } from "./use-driver-mutations";
import { VEHICLE_TYPES } from "./vehicle";
import type { UpdateDriverInput } from "./driver-types";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card } from "@/shared/ui/card";

const schema = z.object({
  vehicleType: z.enum(VEHICLE_TYPES),
  licensePlate: z.string().min(1, "License plate is required").max(20),
});
type FormValues = z.infer<typeof schema>;

export function DriverProfileForm() {
  const update = useUpdateDriverProfile();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    const input: UpdateDriverInput = { vehicleType: values.vehicleType, licensePlate: values.licensePlate };
    update.mutate(input);
  };

  return (
    <Card className="mx-auto max-w-md space-y-4 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Complete your driver profile</h2>
        <p className="text-sm text-muted-foreground">Add your vehicle details to start accepting deliveries.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Label htmlFor="vehicleType">Vehicle type</Label>
          <select
            id="vehicleType"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            defaultValue=""
            {...register("vehicleType")}
          >
            <option value="" disabled>
              Select…
            </option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {errors.vehicleType && <p className="text-sm text-rose-700">Vehicle type is required</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="licensePlate">License plate</Label>
          <Input id="licensePlate" {...register("licensePlate")} />
          {errors.licensePlate && <p className="text-sm text-rose-700">{errors.licensePlate.message}</p>}
        </div>
        {update.error instanceof ApiError && <p className="text-sm text-rose-700">{update.error.title}</p>}
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
