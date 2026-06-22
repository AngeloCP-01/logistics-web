import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { AdminOrderDetailPage } from "./admin-order-detail-page";

function order(status: string) {
  return { id: "o1", customerId: "c1", status, pickup: { street: "1 Pickup Rd", city: "Manila", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "12 Mabini", city: "Cebu", country: "PH", lat: 1, lng: 2 }, items: [{ description: "Crate of mangoes", quantity: 3, weightKg: 5 }], assignedDriverId: "d1", scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };
}

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/admin/orders/${id}`]}>
      <Routes>
        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="/admin/track/:orderId" element={<div>Track screen</div>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: QueryWrapper },
  );
}

describe("AdminOrderDetailPage", () => {
  it("renders addresses, items, and status", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("assigned"))));
    renderAt("o1");
    expect(await screen.findByText(/Crate of mangoes/)).toBeInTheDocument();
    expect(screen.getByText(/12 Mabini/)).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
  });

  it("offers a live-tracking link for an in_transit order", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("in_transit"))));
    renderAt("o1");
    const link = await screen.findByRole("link", { name: /view live tracking/i });
    expect(link).toHaveAttribute("href", "/admin/track/o1");
  });

  it("does not offer live tracking for a created order", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("created"))));
    renderAt("o1");
    await screen.findByText(/Crate of mangoes/);
    expect(screen.queryByRole("link", { name: /view live tracking/i })).not.toBeInTheDocument();
  });

  it("shows a not-found message on a 404", async () => {
    server.use(http.get("/api/orders/missing", () => HttpResponse.json({ title: "Order not found", status: 404 }, { status: 404 })));
    renderAt("missing");
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
