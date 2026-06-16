import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import loginHandler from "./api/auth/login";
import refreshHandler from "./api/auth/refresh";
import logoutHandler from "./api/auth/logout";

// The three Vercel auth functions, keyed by their request path. Everything else
// under /api/* is proxied to the gateway (mirrors vercel.json: function
// precedence first, then the /api -> /v1 rewrite).
type VercelLikeHandler = (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => Promise<void>;
const AUTH_FUNCTIONS: Record<string, VercelLikeHandler> = {
  "/api/auth/login": loginHandler as unknown as VercelLikeHandler,
  "/api/auth/refresh": refreshHandler as unknown as VercelLikeHandler,
  "/api/auth/logout": logoutHandler as unknown as VercelLikeHandler,
};

const HOP_BY_HOP = ["content-encoding", "content-length", "transfer-encoding", "connection"];

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// Add the Vercel response sugar (status/json/send) that the BFF handlers expect
// on top of a Node ServerResponse.
function vercelifyRes(res: ServerResponse): ServerResponse {
  const r = res as ServerResponse & {
    status: (code: number) => ServerResponse;
    json: (body: unknown) => ServerResponse;
    send: (body?: unknown) => ServerResponse;
  };
  r.status = (code: number) => {
    res.statusCode = code;
    return r;
  };
  r.json = (body: unknown) => {
    if (!res.headersSent) res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(body));
    return r;
  };
  r.send = (body?: unknown) => {
    res.end(body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body));
    return r;
  };
  return r;
}

/**
 * Dev-only Vite middleware that makes plain `npm run dev` behave like the Vercel
 * deployment for local full-stack testing: it runs the three auth BFF functions
 * (`api/auth/*`) in-process and proxies every other `/api/*` call to the local
 * gateway's `/v1/*`. Not applied to `vite build` (`apply: "serve"`).
 *
 * `gatewayUrl` is the local gateway origin (e.g. http://localhost:8080); the BFF
 * functions additionally read it from `process.env.GATEWAY_URL` (set in vite.config).
 */
export function devBff(gatewayUrl: string): Plugin {
  return {
    name: "dev-bff",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) {
          next();
          return;
        }
        const path = url.split("?")[0] ?? url;

        void (async () => {
          const fn = AUTH_FUNCTIONS[path];
          if (fn) {
            try {
              const raw = await readBody(req);
              (req as IncomingMessage & { body?: unknown }).body = raw ? JSON.parse(raw) : undefined;
              await fn(req as IncomingMessage & { body?: unknown }, vercelifyRes(res));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ title: "dev-bff function error", detail: String(err) }));
            }
            return;
          }

          // Proxy everything else: /api/<x> -> <gateway>/v1/<x>
          try {
            const target = gatewayUrl + url.replace(/^\/api/, "/v1");
            const method = req.method ?? "GET";
            const hasBody = method !== "GET" && method !== "HEAD";
            const body = hasBody ? await readBody(req) : undefined;
            const headers: Record<string, string> = {};
            if (req.headers.authorization) headers.authorization = String(req.headers.authorization);
            if (req.headers["content-type"]) headers["content-type"] = String(req.headers["content-type"]);
            if (req.headers.cookie) headers.cookie = String(req.headers.cookie);

            const upstream = await fetch(target, { method, headers, body: body || undefined });
            res.statusCode = upstream.status;
            upstream.headers.forEach((value, key) => {
              if (!HOP_BY_HOP.includes(key)) res.setHeader(key, value);
            });
            res.end(Buffer.from(await upstream.arrayBuffer()));
          } catch (err) {
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                title: "dev-bff proxy failed",
                detail: String(err),
                hint: `is the gateway running at ${gatewayUrl}?`,
              }),
            );
          }
        })();
      });
    },
  };
}
