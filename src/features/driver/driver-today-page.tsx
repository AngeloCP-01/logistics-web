import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMyProfile } from "./use-my-profile";
import { useCurrentOffer, useAssignment } from "./use-dispatch-queries";
import { useDriverActiveStore } from "./driver-active-store";
import { DriverProfileForm } from "./driver-profile-form";
import { AvailabilityToggle } from "./availability-toggle";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";

function ActiveDeliveryCard({ orderId }: { orderId: string }) {
  const clearActive = useDriverActiveStore((s) => s.clearActive);
  const assignment = useAssignment(orderId);

  useEffect(() => {
    if (assignment.isError) clearActive();
    else if (assignment.data && !["assigned", "completed"].includes(assignment.data.status)) clearActive();
    else if (assignment.data?.status === "completed") clearActive();
  }, [assignment.isError, assignment.data, clearActive]);

  if (!assignment.data || assignment.data.status !== "assigned") return null;
  return (
    <Link to={`/driver/active/${orderId}`} className="block">
      <Card className="space-y-2 border-indigo-200 p-4">
        <p className="text-sm font-medium">Active delivery</p>
        <p className="text-sm text-muted-foreground">
          To {assignment.data.order.dropoff.street}, {assignment.data.order.dropoff.city}
        </p>
        <Button size="sm">Open delivery</Button>
      </Card>
    </Link>
  );
}

export function DriverTodayPage() {
  const profile = useMyProfile();
  const activeOrderId = useDriverActiveStore((s) => s.activeOrderId);

  const isAvailable = profile.data?.driver?.isAvailable ?? false;
  // Poll for offers only when online and not already on a delivery.
  const offer = useCurrentOffer(isAvailable && activeOrderId === null);

  if (profile.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (profile.error || !profile.data) {
    return <div className="mx-auto max-w-2xl p-8"><p className="text-sm text-muted-foreground">Could not load your profile.</p></div>;
  }

  if (!profile.data.driver || !profile.data.driver.profileComplete) {
    return <div className="p-8"><DriverProfileForm /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Today</h1>
        <AvailabilityToggle isAvailable={isAvailable} />
      </div>

      {activeOrderId && <ActiveDeliveryCard orderId={activeOrderId} />}

      {!activeOrderId && offer.data && (
        <Card className="space-y-2 border-amber-200 p-4">
          <p className="text-sm font-medium">New delivery offer</p>
          <p className="text-sm text-muted-foreground">A delivery is waiting for your response.</p>
          <Link to="/driver/offers"><Button size="sm">View offer</Button></Link>
        </Card>
      )}

      {!activeOrderId && !offer.data && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isAvailable ? "You're online — waiting for delivery offers…" : "Go online to start receiving offers."}
          </p>
        </Card>
      )}
    </div>
  );
}
