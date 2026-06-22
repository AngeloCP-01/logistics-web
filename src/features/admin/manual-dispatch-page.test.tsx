import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { ManualDispatchPage } from "./manual-dispatch-page";

function order(id: string) {
  return { id, customerId: "c1", status: "created", pickup: { street: "1 A", city: "Manila", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "2 B", city: "Cebu", country: "PH", lat: 1, lng: 2 }, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };
}
const DRIVER = { driverId: "d1", displayName: "Dan Driver", vehicleType: "car", availableSince: "2026-06-18T00:00:00Z" };

function renderPage() {
  return render(<MemoryRouter><ManualDispatchPage /></MemoryRouter>, { wrapper: QueryWrapper });
}

describe("ManualDispatchPage", () => {
  it("lists created orders and force-assigns a chosen driver", async () => {
    let assignBody: unknown;
    server.use(
      http.get("/api/orders", () => HttpResponse.json({ items: [order("o1")], nextCursor: null })),
      http.get("/api/dispatch/drivers/available", () => HttpResponse.json({ items: [DRIVER] })),
      http.post("/api/dispatch/assignments/o1/force-assign", async ({ request }) => { assignBody = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /assign driver/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^assign$/i }));
    await waitFor(() => expect(assignBody).toEqual({ driverId: "d1" }));
  });

  it("shows an empty state when no orders need dispatch", async () => {
    server.use(
      http.get("/api/orders", () => HttpResponse.json({ items: [], nextCursor: null })),
      http.get("/api/dispatch/drivers/available", () => HttpResponse.json({ items: [] })),
    );
    renderPage();
    expect(await screen.findByText(/no orders waiting/i)).toBeInTheDocument();
  });
});
