import { toast } from "sonner";
import { useSetAvailability } from "./use-driver-mutations";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";

export function AvailabilityToggle({ isAvailable }: { isAvailable: boolean }) {
  const setAvailability = useSetAvailability();

  const onClick = () =>
    setAvailability.mutate(!isAvailable, {
      onError: (err) => {
        const message =
          err instanceof ApiError && err.status === 409
            ? "Complete your driver profile before going online."
            : "Could not update availability.";
        toast.error(message);
      },
    });

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-slate-300"}`} />
      <span className="text-sm font-medium">{isAvailable ? "Online" : "Offline"}</span>
      <Button variant={isAvailable ? "outline" : "default"} size="sm" disabled={setAvailability.isPending} onClick={onClick}>
        {isAvailable ? "Go offline" : "Go online"}
      </Button>
    </div>
  );
}
