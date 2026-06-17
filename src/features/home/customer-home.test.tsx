import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { CustomerHome } from "./customer-home";

function order(id: string, status: string) {
  return { id, customerId: "u1", status, pickup: { street: "p", city: "c", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "d" + id, city: "c", country: "PH", lat: 1, lng: 2 }, items: [{ description: "x", quantity: 1, weightKg: null }], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-11T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" };
}

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

describe("CustomerHome", () => {
  it("shows an active-delivery banner and recent orders", async () => {
    server.use(http.get("/api/orders/me", ({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      if (status === "in_transit") return HttpResponse.json({ items: [order("oActive", "in_transit")], nextCursor: null });
      if (status === "assigned") return HttpResponse.json({ items: [], nextCursor: null });
      return HttpResponse.json({ items: [order("oActive", "in_transit"), order("oOld", "completed")], nextCursor: null });
    }));
    render(<MemoryRouter><CustomerHome /></MemoryRouter>, { wrapper: QueryWrapper });

    expect(await screen.findByText(/active delivery/i)).toBeInTheDocument();
    expect(await screen.findByText(/doOld/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /place order/i })).toHaveAttribute("href", "/orders/new");
  });

  it("shows the empty CTA when there are no orders", async () => {
    server.use(http.get("/api/orders/me", () => HttpResponse.json({ items: [], nextCursor: null })));
    render(<MemoryRouter><CustomerHome /></MemoryRouter>, { wrapper: QueryWrapper });
    expect(await screen.findByText(/place your first order/i)).toBeInTheDocument();
  });

  it("shows a Track link on the active-delivery banner", async () => {
    server.use(
      http.get("/api/orders/me", ({ request }) => {
        const status = new URL(request.url).searchParams.get("status");
        if (status === "in_transit") {
          return HttpResponse.json({
            items: [{ id: "oActive", customerId: "u1", status: "in_transit", pickup: { street: "1 A", city: "M", country: "PH", lat: 14, lng: 121 }, dropoff: { street: "2 B", city: "M", country: "PH", lat: 14, lng: 121 }, items: [], assignedDriverId: "d1", scheduledFor: null, cancelReason: null, createdAt: "2026-06-17T00:00:00Z", updatedAt: "2026-06-17T00:00:00Z" }],
            nextCursor: null,
          });
        }
        return HttpResponse.json({ items: [], nextCursor: null });
      }),
    );
    render(<MemoryRouter><CustomerHome /></MemoryRouter>, { wrapper: QueryWrapper });
    const track = await screen.findByRole("link", { name: /track/i });
    expect(track).toHaveAttribute("href", "/track/oActive");
  });
});
