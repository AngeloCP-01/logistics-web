import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCookie, gatewayPost, readRefreshCookie, sendProblem } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") return sendProblem(res, 405, "Method Not Allowed");

  const refreshToken = readRefreshCookie(req.headers.cookie);
  if (refreshToken) {
    try {
      await gatewayPost("/v1/auth/logout", { refreshToken });
    } catch {
      // best-effort revoke; we clear the cookie regardless
    }
  }
  res.setHeader("Set-Cookie", clearCookie());
  res.status(204).end();
}
