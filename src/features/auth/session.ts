import { useAuthStore, type AuthUser } from "./auth-store";
import { parseProblem } from "@/shared/api/api-error";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

interface SessionResponse {
  accessToken: string;
  user: AuthUser;
}

async function postAuth(path: string, body?: unknown): Promise<Response> {
  const init: RequestInit = { method: "POST" };
  if (body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return fetch(`${BASE}${path}`, init);
}

function apply(session: SessionResponse): void {
  useAuthStore.getState().setSession(session.accessToken, session.user);
}

export async function refreshSession(): Promise<void> {
  const res = await postAuth("/auth/refresh");
  if (!res.ok) {
    useAuthStore.getState().clear();
    throw new Error("refresh failed");
  }
  apply((await res.json()) as SessionResponse);
}

export async function bootstrapSession(): Promise<boolean> {
  try {
    await refreshSession();
    return true;
  } catch {
    return false;
  }
}

export async function loginRequest(input: { email: string; password: string }): Promise<void> {
  const res = await postAuth("/auth/login", input);
  if (!res.ok) {
    throw await parseProblem(res);
  }
  apply((await res.json()) as SessionResponse);
}

export async function logoutRequest(): Promise<void> {
  try {
    await postAuth("/auth/logout");
  } finally {
    useAuthStore.getState().clear();
  }
}

export async function registerRequest(input: { email: string; password: string; role: "customer" | "driver" }): Promise<void> {
  const res = await postAuth("/auth/register", input);
  if (!res.ok) {
    throw await parseProblem(res);
  }
  await loginRequest({ email: input.email, password: input.password });
}
