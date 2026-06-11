import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OrderCard } from "./order-card";

const order = {
  id: "ord-123456",
  customerId: "u1",
  status: "in_transit" as const,
  pickup: { street: "1 A St", city: "Manila", country: "PH", lat: 14, lng: 121 },
  dropoff: { label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 },
  items: [{ description: "Box", quantity: 2 }],
  assignedDriverId: "d1",
  scheduledFor: null,
  cancelReason: null,
  createdAt: "2026-06-11T08:30:00.000Z",
  updatedAt: "2026-06-11T08:30:00.000Z",
};

describe("OrderCard", () => {
  it("shows the status badge, dropoff, and links to the detail", () => {
    render(<OrderCard order={order} />, { wrapper: MemoryRouter });
    expect(screen.getByText("In transit")).toBeInTheDocument();
    expect(screen.getByText(/12 Mabini/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/orders/ord-123456");
  });
});
