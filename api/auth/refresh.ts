import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSetCookie, clearCookie, gatewayPost, gatewayUrl, readRefreshCookie, sendProblem } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") return sendProblem(res, 405, "Method Not Allowed");

  const refreshToken = readRefreshCookie(req.headers.cookie);
  if (!refreshToken) {
    res.setHeader("Set-Cookie", clearCookie());
    return sendProblem(res, 401, "No session");
  }

  const refreshRes = await gatewayPost("/v1/auth/refresh", { refreshToken });
  if (!refreshRes.ok) {
    res.setHeader("Set-Cookie", clearCookie());
    return sendProblem(res, 401, "Session expired");
  }
  const pair = (await refreshRes.json()) as { accessToken: string; refreshToken: string };

  const meRes = await fetch(`${gatewayUrl()}/v1/auth/me`, {
    headers: { authorization: `Bearer ${pair.accessToken}` },
  });
  if (!meRes.ok) {
    res.setHeader("Set-Cookie", clearCookie());
    return sendProblem(res, 502, "Failed to load profile");
  }
  const user = (await meRes.json()) as { id: string; email: string; role: string };

  res.setHeader("Set-Cookie", buildSetCookie(pair.refreshToken));
  res.status(200).json({ accessToken: pair.accessToken, user });
}
