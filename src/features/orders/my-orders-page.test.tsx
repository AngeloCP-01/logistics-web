import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { MyOrdersPage } from "./my-orders-page";

function order(id: string, status: string) {
  return { id, customerId: "u1", status, pickup: { street: "p", city: "c", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "d" + id, city: "c", country: "PH", lat: 1, lng: 2 }, items: [{ description: "x", quantity: 1, weightKg: null }], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-11T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" };
}

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

function renderPage() {
  return render(<MemoryRouter><MyOrdersPage /></MemoryRouter>, { wrapper: QueryWrapper });
}

describe("MyOrdersPage", () => {
  it("renders the order list", async () => {
    server.use(http.get("/api/orders/me", () => HttpResponse.json({ items: [order("o1", "created"), order("o2", "completed")], nextCursor: null })));
    renderPage();
    expect(await screen.findByText(/do1/)).toBeInTheDocument();
    expect(screen.getByText(/do2/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no orders", async () => {
    server.use(http.get("/api/orders/me", () => HttpResponse.json({ items: [], nextCursor: null })));
    renderPage();
    expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
  });

  it("applies the status filter", async () => {
    let lastStatus: string | null = "unset";
    server.use(http.get("/api/orders/me", ({ request }) => {
      lastStatus = new URL(request.url).searchParams.get("status");
      return HttpResponse.json({ items: [], nextCursor: null });
    }));
    renderPage();
    await waitFor(() => expect(lastStatus).toBeNull());
    await userEvent.selectOptions(screen.getByLabelText(/filter by status/i), "in_transit");
    await waitFor(() => expect(lastStatus).toBe("in_transit"));
  });
});
