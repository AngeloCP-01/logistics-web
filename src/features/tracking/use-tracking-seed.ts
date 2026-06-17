import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/api-error";
import { trackingKeys } from "@/shared/api/query-keys";
import type { LocationPoint, TrackingRoute } from "./tracking-types";

const EMPTY_ROUTE: TrackingRoute = { items: [], nextCursor: null };

function isNotFound(e: unknown): boolean {
  return e instanceof ApiError && e.status === 404;
}

export function useRouteSeed(orderId: string) {
  return useQuery({
    queryKey: trackingKeys.route(orderId),
    queryFn: async (): Promise<TrackingRoute> => {
      try {
        return await api<TrackingRoute>(`/tracking/orders/${orderId}/route`);
      } catch (e) {
        if (isNotFound(e)) return EMPTY_ROUTE;
        throw e;
      }
    },
  });
}

export function useLatestSeed(orderId: string) {
  return useQuery({
    queryKey: trackingKeys.latest(orderId),
    queryFn: async (): Promise<LocationPoint | null> => {
      try {
        return await api<LocationPoint>(`/tracking/orders/${orderId}/latest`);
      } catch (e) {
        if (isNotFound(e)) return null;
        throw e;
      }
    },
  });
}
