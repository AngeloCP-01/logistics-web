import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import type { TrackingSocketState } from "./use-tracking-socket";

// Isolate the page from WebGL + the live socket.
vi.mock("./tracking-map", () => ({
  TrackingMap: () => <div data-testid="tracking-map" />,
}));
const socketState = vi.fn<() => TrackingSocketState>();
vi.mock("./use-tracking-socket", () => ({
  useTrackingSocket: () => socketState(),
}));

import { TrackPage } from "./track-page";

function order(status: string) {
  return {
    id: "o1",
    customerId: "u1",
    status,
    pickup: { street: "1 Pickup Rd", city: "Manila", country: "PH", lat: 14.5, lng: 121.0 },
    dropoff: { label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121.05 },
    items: [{ description: "Box", quantity: 1, weightKg: null }],
    assignedDriverId: "d1",
    scheduledFor: null,
    cancelReason: null,
    createdAt: "2026-06-17T00:00:00Z",
    updatedAt: "2026-06-17T00:00:00Z",
  };
}

const POINT = { orderId: "o1", lat: 14.55, lng: 121.02, ts: "2026-06-17T00:05:00Z" };

function seedOk() {
  server.use(
    http.get("/api/orders/o1", () => HttpResponse.json(order("in_transit"))),
    http.get("/api/tracking/orders/o1/route", () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get("/api/tracking/orders/o1/latest", () => HttpResponse.json({ title: "x", status: 404 }, { status: 404 })),
  );
}

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/track/${id}`]}>
      <Routes>
        <Route path="/track/:orderId" element={<TrackPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: QueryWrapper },
  );
}

const noopProducers = {
  sendLocation: vi.fn(),
  sendPickup: vi.fn(),
  sendComplete: vi.fn(),
};

beforeEach(() => {
  socketState.mockReturnValue({ latest: null, phase: null, connected: false, error: null, ...noopProducers });
  useAuthStore.getState().setSession("tok", { id: "u1", email: "c@x.com", role: "customer" });
});

describe("TrackPage", () => {
  it("shows a waiting state when no driver point exists yet", async () => {
    seedOk();
    renderAt("o1");
    expect(await screen.findByText(/waiting for the driver/i)).toBeInTheDocument();
    expect(screen.queryByTestId("tracking-map")).not.toBeInTheDocument();
  });

  it("renders the map and an ETA once a live point arrives", async () => {
    seedOk();
    socketState.mockReturnValue({ latest: POINT, phase: "in_transit", connected: true, error: null, ...noopProducers });
    renderAt("o1");
    expect(await screen.findByTestId("tracking-map")).toBeInTheDocument();
    expect(screen.getByText(/ETA ~\d+ min/)).toBeInTheDocument();
  });

  it("shows a delivered terminal state on completion", async () => {
    seedOk();
    socketState.mockReturnValue({ latest: POINT, phase: "completed", connected: true, error: null, ...noopProducers });
    renderAt("o1");
    expect(await screen.findByText(/delivered/i)).toBeInTheDocument();
  });

  it("reflects the live WS phase in the status badge, not a stale REST status", async () => {
    // The order-service reflector can lag, so the REST status is still "created"
    // while the driver is already in transit. The badge must follow the live phase.
    server.use(
      http.get("/api/orders/o1", () => HttpResponse.json(order("created"))),
      http.get("/api/tracking/orders/o1/route", () => HttpResponse.json({ items: [], nextCursor: null })),
      http.get("/api/tracking/orders/o1/latest", () => HttpResponse.json({ title: "x", status: 404 }, { status: 404 })),
    );
    socketState.mockReturnValue({ latest: POINT, phase: "in_transit", connected: true, error: null, ...noopProducers });
    renderAt("o1");
    expect(await screen.findByText("In transit")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
  });

  it("shows a completed badge from the live phase even if REST lags", async () => {
    server.use(
      http.get("/api/orders/o1", () => HttpResponse.json(order("created"))),
      http.get("/api/tracking/orders/o1/route", () => HttpResponse.json({ items: [], nextCursor: null })),
      http.get("/api/tracking/orders/o1/latest", () => HttpResponse.json({ title: "x", status: 404 }, { status: 404 })),
    );
    socketState.mockReturnValue({ latest: POINT, phase: "completed", connected: true, error: null, ...noopProducers });
    renderAt("o1");
    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
  });

  it("shows a not-found message when the order 404s", async () => {
    server.use(
      http.get("/api/orders/missing", () => HttpResponse.json({ title: "Order not found", status: 404 }, { status: 404 })),
      http.get("/api/tracking/orders/missing/route", () => HttpResponse.json({ items: [], nextCursor: null })),
      http.get("/api/tracking/orders/missing/latest", () => HttpResponse.json({ title: "x", status: 404 }, { status: 404 })),
    );
    renderAt("missing");
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
