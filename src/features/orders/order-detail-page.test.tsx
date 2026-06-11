import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { OrderDetailPage } from "./order-detail-page";

function order(status: string) {
  return { id: "o1", customerId: "u1", status, pickup: { street: "1 Pickup Rd", city: "Manila", country: "PH", lat: 1, lng: 2 }, dropoff: { label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 1, lng: 2 }, items: [{ description: "Crate of mangoes", quantity: 3, weightKg: 5 }], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-11T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" };
}

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/orders/${id}`]}>
      <Routes><Route path="/orders/:id" element={<OrderDetailPage />} /></Routes>
    </MemoryRouter>,
    { wrapper: QueryWrapper },
  );
}

describe("OrderDetailPage", () => {
  it("renders items, addresses, and status", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("assigned"))));
    renderAt("o1");
    expect(await screen.findByText(/Crate of mangoes/)).toBeInTheDocument();
    expect(screen.getByText(/12 Mabini/)).toBeInTheDocument();
    expect(screen.getByText(/1 Pickup Rd/)).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
  });

  it("offers cancel for an assigned order", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("assigned"))));
    renderAt("o1");
    expect(await screen.findByRole("button", { name: /cancel order/i })).toBeInTheDocument();
  });

  it("does not offer cancel for an in_transit order", async () => {
    server.use(http.get("/api/orders/o1", () => HttpResponse.json(order("in_transit"))));
    renderAt("o1");
    await screen.findByText(/Crate of mangoes/);
    expect(screen.queryByRole("button", { name: /cancel order/i })).not.toBeInTheDocument();
  });

  it("shows a not-found message on a 404", async () => {
    server.use(http.get("/api/orders/missing", () => HttpResponse.json({ title: "Order not found", status: 404 }, { status: 404 })));
    renderAt("missing");
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
