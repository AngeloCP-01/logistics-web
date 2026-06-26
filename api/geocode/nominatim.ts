export interface GeocodedLocation {
  lat: number;
  lng: number;
  street: string;
  city: string;
  country: string;
}

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  country_code?: string;
}

export class BadCoordinatesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadCoordinatesError";
  }
}

const USER_AGENT = `logistics-web/0.6.0 (${process.env.GEOCODE_CONTACT ?? "dev@localhost"})`;

export function nominatimToAddress(addr: NominatimAddress | undefined): { street: string; city: string; country: string } {
  const a = addr ?? {};
  const road = a.road ?? a.pedestrian ?? a.neighbourhood ?? "";
  const street = [a.house_number, road].filter(Boolean).join(" ").trim();
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
  const country = (a.country_code ?? "").toUpperCase();
  return { street, city, country };
}

export async function reverseGeocode(
  input: { lat: number; lng: number },
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodedLocation> {
  const { lat, lng } = input;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new BadCoordinatesError("lat must be -90…90");
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new BadCoordinatesError("lng must be -180…180");

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&zoom=18`;
  const res = await fetchImpl(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`nominatim responded ${res.status}`);
  const body = (await res.json()) as { address?: NominatimAddress };
  return { lat, lng, ...nominatimToAddress(body.address) };
}
