import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { AdminOrdersPage } from "./admin-orders-page";

function order(id: string, status: string) {
  return { id, customerId: "cust-1234", status, pickup: { street: "1 A", city: "Manila", country: "PH", lat: 14.5, lng: 121 }, dropoff: { street: "2 B", city: "Cebu", country: "PH", lat: 14.6, lng: 121.05 }, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };
}

function renderPage() {
  return render(<MemoryRouter><AdminOrdersPage /></MemoryRouter>, { wrapper: QueryWrapper });
}

describe("AdminOrdersPage", () => {
  it("renders the orders table with a row per order linking to its detail", async () => {
    server.use(http.get("/api/orders", () => HttpResponse.json({ items: [order("o1", "assigned"), order("o2", "completed")], nextCursor: null })));
    renderPage();
    expect((await screen.findAllByText("Cebu"))[0]).toBeInTheDocument();
    expect(screen.getAllByText("Assigned")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Completed")[0]).toBeInTheDocument();
    const link = screen.getAllByRole("link")[0];
    expect(link).toHaveAttribute("href", expect.stringContaining("/admin/orders/o1"));
  });

  it("shows an empty state when there are no orders", async () => {
    server.use(http.get("/api/orders", () => HttpResponse.json({ items: [], nextCursor: null })));
    renderPage();
    expect(await screen.findByText(/no orders/i)).toBeInTheDocument();
  });
});
