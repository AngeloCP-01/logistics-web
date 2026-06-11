import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusBadge, statusLabel } from "./order-status";

describe("OrderStatusBadge", () => {
  it("renders a human label for each status", () => {
    expect(statusLabel("created")).toBe("Created");
    expect(statusLabel("assigned")).toBe("Assigned");
    expect(statusLabel("in_transit")).toBe("In transit");
    expect(statusLabel("completed")).toBe("Completed");
    expect(statusLabel("cancelled")).toBe("Cancelled");
  });

  it("renders the label text in the badge", () => {
    render(<OrderStatusBadge status="in_transit" />);
    expect(screen.getByText("In transit")).toBeInTheDocument();
  });
});
