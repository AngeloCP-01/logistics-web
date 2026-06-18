import type { components as UserComponents } from "@/shared/api/types/user";
import type { components as DispatchComponents } from "@/shared/api/types/dispatch";
import type { VEHICLE_TYPES } from "./vehicle";

export type MyProfile = UserComponents["schemas"]["MyProfile"];
export type DriverInfo = NonNullable<MyProfile["driver"]>;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export type Assignment = DispatchComponents["schemas"]["Assignment"];
export type AssignmentStatus = Assignment["status"];
export type CurrentOffer = DispatchComponents["schemas"]["CurrentOffer"];
export type OrderSummary = DispatchComponents["schemas"]["OrderSummary"];

export interface UpdateDriverInput {
  vehicleType: VehicleType;
  licensePlate: string;
}
