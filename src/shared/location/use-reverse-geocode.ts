import { useMutation, type UseMutationResult } from "@tanstack/react-query";

export interface GeocodedLocation {
  lat: number;
  lng: number;
  street: string;
  city: string;
  country: string;
}

async function fetchReverseGeocode(input: { lat: number; lng: number }): Promise<GeocodedLocation> {
  const res = await fetch(`/api/geocode/reverse?lat=${input.lat}&lng=${input.lng}`);
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  return (await res.json()) as GeocodedLocation;
}

export function useReverseGeocode(): UseMutationResult<GeocodedLocation, Error, { lat: number; lng: number }> {
  return useMutation({ mutationFn: fetchReverseGeocode });
}
