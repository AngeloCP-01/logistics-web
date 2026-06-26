import type { VercelRequest, VercelResponse } from "@vercel/node";
import { reverseGeocode, BadCoordinatesError } from "./nominatim";

function problem(res: VercelResponse, status: number, title: string): void {
  res.status(status).json({ type: "urn:logistics:web-bff:error", title, status });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET") return problem(res, 405, "Method Not Allowed");

  const url = new URL(req.url ?? "", "http://localhost");
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  try {
    const result = await reverseGeocode({ lat, lng });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof BadCoordinatesError) return problem(res, 400, err.message);
    return problem(res, 502, "Geocoding failed");
  }
}
