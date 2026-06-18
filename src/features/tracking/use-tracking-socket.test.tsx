import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAuthStore } from "@/features/auth/auth-store";

// A controllable fake Socket.IO socket: capture handlers so the test can fire events.
const handlers: Record<string, (...args: unknown[]) => void> = {};
const fakeSocket = {
  on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    handlers[event] = cb;
    return fakeSocket;
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
};
const ioMock = vi.fn((..._args: unknown[]) => fakeSocket);
vi.mock("socket.io-client", () => ({ io: (...args: unknown[]) => ioMock(...args) }));

import { useTrackingSocket } from "./use-tracking-socket";

const fire = (event: string, payload?: unknown) =>
  act(() => {
    handlers[event]?.(payload);
  });

beforeEach(() => {
  for (const k of Object.keys(handlers)) delete handlers[k];
  ioMock.mockClear();
  fakeSocket.emit.mockClear();
  fakeSocket.disconnect.mockClear();
  vi.stubEnv("VITE_WS_URL", "ws://localhost:9999");
  useAuthStore.getState().setSession("tok", { id: "u1", email: "c@x.com", role: "customer" });
});

describe("useTrackingSocket", () => {
  it("joins the order room on connect", () => {
    renderHook(() => useTrackingSocket("o1"));
    fire("connect");
    expect(fakeSocket.emit).toHaveBeenCalledWith("room:join", { orderId: "o1" });
  });

  it("tracks the latest driver location", () => {
    const { result } = renderHook(() => useTrackingSocket("o1"));
    fire("connect");
    const point = { orderId: "o1", lat: 14.6, lng: 121.0, ts: "2026-06-17T00:00:00Z" };
    fire("driver:location", point);
    expect(result.current.latest).toEqual(point);
  });

  it("advances the phase on lifecycle events", () => {
    const { result } = renderHook(() => useTrackingSocket("o1"));
    fire("delivery:in_transit", { orderId: "o1" });
    expect(result.current.phase).toBe("in_transit");
    fire("delivery:completed", { orderId: "o1" });
    expect(result.current.phase).toBe("completed");
  });

  it("records a server error payload", () => {
    const { result } = renderHook(() => useTrackingSocket("o1"));
    fire("error", { code: "forbidden", message: "not your order" });
    expect(result.current.error).toBe("not your order");
  });

  it("passes a fresh token through the auth callback", () => {
    renderHook(() => useTrackingSocket("o1"));
    const opts = ioMock.mock.calls[0]?.[1] as unknown as { auth: (cb: (d: unknown) => void) => void };
    let delivered: unknown;
    opts.auth((d) => (delivered = d));
    expect(delivered).toEqual({ token: "tok" });
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderHook(() => useTrackingSocket("o1"));
    unmount();
    expect(fakeSocket.disconnect).toHaveBeenCalled();
  });

  it("ignores a driver:location whose orderId does not match", () => {
    const { result } = renderHook(() => useTrackingSocket("o1"));
    fire("connect");
    const wrongPoint = { orderId: "other-order", lat: 14.6, lng: 121.0, ts: "2026-06-17T00:00:00Z" };
    fire("driver:location", wrongPoint);
    expect(result.current.latest).toBeNull();
  });

  it("ignores a delivery:completed whose orderId does not match", () => {
    const { result } = renderHook(() => useTrackingSocket("o1"));
    fire("delivery:completed", { orderId: "other-order" });
    expect(result.current.phase).toBeNull();
  });

  it("sets a fallback message when error fires with a non-conforming payload", () => {
    const { result } = renderHook(() => useTrackingSocket("o1"));
    fire("error", "unexpected string payload");
    expect(result.current.error).toBe("connection error");

    fire("error", {});
    expect(result.current.error).toBe("connection error");
  });
});
