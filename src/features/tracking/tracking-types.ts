import type { components } from "@/shared/api/types/tracking";

// REST shapes (generated from logistics-contracts/openapi/tracking-service.yaml).
export type LocationPoint = components["schemas"]["LocationPoint"];
export type TrackingRoute = components["schemas"]["Route"];

// WebSocket payloads (hand-defined from logistics-contracts/docs/tracking-ws.md;
// `driver:location` shares the LocationPoint shape).
export interface LifecycleSignal {
  orderId: string;
}
export interface TrackingErrorPayload {
  code: string;
  message: string;
}

// Lifecycle phase as the tracking screen understands it.
export type TrackingPhase = "pending" | "in_transit" | "completed";

export interface LatLng {
  lat: number;
  lng: number;
}
