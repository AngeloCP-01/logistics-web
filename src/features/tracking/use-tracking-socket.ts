import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/features/auth/auth-store";
import type {
  LifecycleSignal,
  LocationPoint,
  TrackingPhase,
} from "./tracking-types";

const SOCKET_PATH = "/v1/tracking/socket.io/";

export interface TrackingSocketState {
  latest: LocationPoint | null;
  phase: TrackingPhase | null;
  connected: boolean;
  error: string | null;
}

export function useTrackingSocket(orderId: string): TrackingSocketState {
  const [latest, setLatest] = useState<LocationPoint | null>(null);
  const [phase, setPhase] = useState<TrackingPhase | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    // Without a configured WS origin there is nothing to connect to (e.g. the
    // hermetic Playwright build) — render the screen's pre-stream states instead.
    if (!wsUrl) return;

    // Socket.IO reads the engine path from `path`, not the URI pathname (a pathname
    // would be parsed as a namespace). Connect to the origin + explicit path.
    const origin = new URL(wsUrl).origin;
    const socket: Socket = io(origin, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      // Called on every (re)connection attempt → always the current in-memory token.
      auth: (cb: (data: { token: string }) => void) =>
        cb({ token: useAuthStore.getState().accessToken ?? "" }),
    });

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      socket.emit("room:join", { orderId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err: Error) => setError(err.message));
    socket.on("driver:location", (p: LocationPoint) => {
      if (p.orderId === orderId) setLatest(p);
    });
    socket.on("delivery:in_transit", (p: LifecycleSignal) => {
      if (p.orderId === orderId) setPhase("in_transit");
    });
    socket.on("delivery:completed", (p: LifecycleSignal) => {
      if (p.orderId === orderId) setPhase("completed");
    });
    // "error" is a reserved Socket.IO event — the manager/parser can emit it with an
    // Error object or a string, so we cannot trust p.message blindly; derive a safe string.
    socket.on("error", (p: unknown) => {
      const message =
        typeof p === "object" &&
        p !== null &&
        "message" in p &&
        typeof (p as { message: unknown }).message === "string"
          ? (p as { message: string }).message
          : "connection error";
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return { latest, phase, connected, error };
}
