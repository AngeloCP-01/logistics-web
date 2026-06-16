import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { devBff } from "./vite-plugin-dev-bff";

export default defineConfig(({ mode }) => {
  // GATEWAY_URL (non-VITE_) is read by the dev BFF + proxied to. Default to the
  // local gateway. The three auth functions also read process.env.GATEWAY_URL.
  const env = loadEnv(mode, process.cwd(), "");
  const gatewayUrl = env.GATEWAY_URL ?? "http://localhost:8080";
  process.env.GATEWAY_URL = gatewayUrl;

  return {
    plugins: [react(), devBff(gatewayUrl)],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    server: { port: 5173 },
  };
});
