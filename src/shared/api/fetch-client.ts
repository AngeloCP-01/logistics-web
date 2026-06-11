import { useAuthStore } from "@/features/auth/auth-store";
import { ApiError, parseProblem } from "./api-error";

export interface FetchClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  refresh: () => Promise<void>;
}

export type FetchClient = <T>(path: string, init?: RequestInit) => Promise<T>;

export function createFetchClient(opts: FetchClientOptions): FetchClient {
  // Resolve the global `fetch` at call time, not module-eval time: test runners
  // (vitest jsdom) and MSW replace `globalThis.fetch` after this module is
  // evaluated, so a captured reference would be stale and bypass interception.
  const doFetch: typeof fetch = opts.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  let inFlightRefresh: Promise<void> | null = null;

  function refreshOnce(): Promise<void> {
    if (!inFlightRefresh) {
      inFlightRefresh = opts.refresh().finally(() => {
        inFlightRefresh = null;
      });
    }
    return inFlightRefresh;
  }

  function withAuth(init: RequestInit | undefined): RequestInit {
    const headers = new Headers(init?.headers);
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    return { ...init, headers };
  }

  return async function client<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${opts.baseUrl}${path}`;
    let res = await doFetch(url, withAuth(init));

    if (res.status === 401) {
      try {
        await refreshOnce();
      } catch {
        throw await parseProblem(res);
      }
      res = await doFetch(url, withAuth(init));
    }

    if (!res.ok) throw await parseProblem(res);
    // 204 has no body; callers of no-content endpoints type T as void/undefined.
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  };
}

export { ApiError };
