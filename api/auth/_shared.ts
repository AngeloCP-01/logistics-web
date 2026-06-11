import type { VercelResponse } from "@vercel/node";

export const REFRESH_COOKIE = "rt";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function gatewayUrl(): string {
  const url = process.env.GATEWAY_URL;
  if (!url) throw new Error("GATEWAY_URL is not set");
  return url;
}

export function buildSetCookie(refreshToken: string): string {
  return [
    `${REFRESH_COOKIE}=${refreshToken}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/api/auth",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ].join("; ");
}

export function clearCookie(): string {
  return [`${REFRESH_COOKIE}=`, "HttpOnly", "Secure", "SameSite=Lax", "Path=/api/auth", "Max-Age=0"].join("; ");
}

export function readRefreshCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === REFRESH_COOKIE) return v.join("=") || null;
  }
  return null;
}

export async function gatewayPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${gatewayUrl()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function sendProblem(res: VercelResponse, status: number, title: string): void {
  res.status(status).json({ type: "urn:logistics:web-bff:error", title, status });
}
