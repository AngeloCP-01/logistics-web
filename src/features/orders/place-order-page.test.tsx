import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { PlaceOrderPage } from "./place-order-page";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: { children?: ReactNode; onClick?: (e: { lngLat: { lat: number; lng: number } }) => void }) => (
    <div data-testid="map" onClick={() => onClick?.({ lngLat: { lat: 14.6, lng: 121 } })}>{children}</div>
  ),
  Marker: () => <div data-testid="pin" />,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const ADDR = { id: "a1", userId: "u1", label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 };

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/orders/new"]}>
      <Routes>
        <Route path="/orders/new" element={<PlaceOrderPage />} />
        <Route path="/orders/:id" element={<div>order detail</div>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: QueryWrapper },
  );
}

describe("PlaceOrderPage", () => {
  it("places an order and navigates to its detail", async () => {
    let posted: unknown;
    server.use(
      http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [ADDR], nextCursor: null })),
      http.get("/api/geocode/reverse", () => HttpResponse.json({ lat: 14.6, lng: 121, street: "1 A St", city: "Manila", country: "PH" })),
      http.post("/api/orders", async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ id: "oNew", customerId: "u1", status: "created", pickup: {}, dropoff: {}, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "x", updatedAt: "x" }, { status: 201 });
      }),
    );
    renderPage();

    await screen.findByRole("option", { name: /Home/ });
    await userEvent.click(screen.getByTestId("map"));
    await screen.findByTestId("pin");
    await userEvent.selectOptions(screen.getByLabelText(/dropoff address/i), "a1");
    await userEvent.type(screen.getByLabelText(/item 1 description/i), "Box of books");
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText("order detail")).toBeInTheDocument();
    expect(posted).toMatchObject({ dropoffAddressId: "a1", items: [{ description: "Box of books", quantity: 1 }] });
  });

  it("shows validation errors and does not submit when required fields are empty", async () => {
    let called = false;
    server.use(
      http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [ADDR], nextCursor: null })),
      http.post("/api/orders", () => { called = true; return HttpResponse.json({}, { status: 201 }); }),
    );
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));
    expect(await screen.findAllByText(/required|select a dropoff/i)).not.toHaveLength(0);
    expect(called).toBe(false);
  });
});
