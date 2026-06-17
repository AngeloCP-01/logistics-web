import type { LatLng } from "./tracking-types";

const EARTH_RADIUS_KM = 6371;
const ASSUMED_SPEED_KMH = 30;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function etaMinutes(from: LatLng, to: LatLng): number {
  const hours = haversineKm(from, to) / ASSUMED_SPEED_KMH;
  return Math.round(hours * 60);
}
