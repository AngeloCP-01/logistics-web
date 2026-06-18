import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { useDriverActiveStore } from "./driver-active-store";
import type { TrackingSocketState } from "@/features/tracking/use-tracking-socket";

vi.mock("@/features/tracking/tracking-map", () => ({ TrackingMap: () => <div data-testid="tracking-map" /> }));
const socket: { value: TrackingSocketState } = { value: {} as TrackingSocketState };
vi.mock("@/features/tracking/use-tracking-socket", () => ({ useTrackingSocket: () => socket.value }));
vi.mock("./use-geolocation-stream", () => ({ useGeolocationStream: () => {} }));

import { ActiveDeliveryPage } from "./active-delivery-page";

const ASSIGNMENT = (status: string) => ({
  orderId: "o1", status, assignedDriverId: "u1", offerAttempts: 1,
  order: { pickup: { street: "1 Pickup", city: "Manila", country: "PH", lat: 14.5, lng: 121 }, dropoff: { street: "2 Dropoff", city: "Manila", country: "PH", lat: 14.6, lng: 121.05 }, items: [{ description: "Box", quantity: 1, weightKg: null }] },
});

function setSocket(over: Partial<TrackingSocketState>) {
  socket.value = { latest: null, phase: null, connected: true, error: null, sendLocation: vi.fn(), sendPickup: vi.fn(), sendComplete: vi.fn(), ...over };
}

beforeEach(() => {
  localStorage.clear();
  useDriverActiveStore.getState().setActive("o1");
  useAuthStore.getState().setSession("t", { id: "u1", email: "d@x.com", role: "driver" });
  setSocket({});
  server.use(http.get("/api/tracking/orders/o1/route", () => HttpResponse.json({ items: [], nextCursor: null })));
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/driver/active/o1"]}>
      <Routes>
        <Route path="/driver" element={<div>Today screen</div>} />
        <Route path="/driver/active/:orderId" element={<ActiveDeliveryPage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: QueryWrapper },
  );
}

describe("ActiveDeliveryPage", () => {
  it("offers Picked up while the delivery is pending", async () => {
    server.use(http.get("/api/dispatch/assignments/o1", () => HttpResponse.json(ASSIGNMENT("assigned"))));
    renderPage();
    expect(await screen.findByRole("button", { name: /picked up/i })).toBeInTheDocument();
  });

  it("emits pickup when Picked up is clicked", async () => {
    server.use(http.get("/api/dispatch/assignments/o1", () => HttpResponse.json(ASSIGNMENT("assigned"))));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /picked up/i }));
    expect(socket.value.sendPickup).toHaveBeenCalled();
  });

  it("offers Delivered once in transit", async () => {
    setSocket({ phase: "in_transit" });
    server.use(http.get("/api/dispatch/assignments/o1", () => HttpResponse.json(ASSIGNMENT("assigned"))));
    renderPage();
    expect(await screen.findByRole("button", { name: /delivered/i })).toBeInTheDocument();
  });

  it("shows the terminal state and clears the active order on completion", async () => {
    setSocket({ phase: "completed" });
    server.use(http.get("/api/dispatch/assignments/o1", () => HttpResponse.json(ASSIGNMENT("assigned"))));
    renderPage();
    expect(await screen.findByText(/delivery complete/i)).toBeInTheDocument();
    expect(useDriverActiveStore.getState().activeOrderId).toBeNull();
  });
});
