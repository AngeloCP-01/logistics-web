import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSetCookie, gatewayPost, gatewayUrl, sendProblem } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") return sendProblem(res, 405, "Method Not Allowed");

  const loginRes = await gatewayPost("/v1/auth/login", req.body);
  if (!loginRes.ok) {
    res.status(loginRes.status).json(await safeJson(loginRes));
    return;
  }
  const pair = (await loginRes.json()) as { accessToken: string; refreshToken: string };

  const meRes = await fetch(`${gatewayUrl()}/v1/auth/me`, {
    headers: { authorization: `Bearer ${pair.accessToken}` },
  });
  if (!meRes.ok) return sendProblem(res, 502, "Failed to load profile");
  const user = (await meRes.json()) as { id: string; email: string; role: string };

  res.setHeader("Set-Cookie", buildSetCookie(pair.refreshToken));
  res.status(200).json({ accessToken: pair.accessToken, user });
}

async function safeJson(r: Response): Promise<unknown> {
  try { return await r.json(); } catch { return { title: "Request failed", status: r.status }; }
}
