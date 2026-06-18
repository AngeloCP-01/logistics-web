import { useEffect, useRef } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export function useGeolocationStream(
  enabled: boolean,
  onPosition: (p: GeoPosition) => void,
  onError?: (message: string) => void,
): void {
  // Read callbacks via refs so the effect depends only on `enabled` (stable watch lifecycle).
  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      onErrorRef.current?.("Geolocation is not available on this device");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        onPositionRef.current({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => onErrorRef.current?.(err.message),
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);
}
