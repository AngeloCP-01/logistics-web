import { createFetchClient } from "./fetch-client";
import { refreshSession } from "@/features/auth/session";

export const api = createFetchClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  refresh: refreshSession,
});
