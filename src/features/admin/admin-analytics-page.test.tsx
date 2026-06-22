import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";

// Recharts needs real layout (ResizeObserver) — stub the chart.
vi.mock("./deliveries-chart", () => ({ DeliveriesChart: () => <div data-testid="deliveries-chart" /> }));

import { AdminAnalyticsPage } from "./admin-analytics-page";

function order(status: string) {
  return { id: Math.random().toString(), customerId: "c1", status, pickup: { street: "1", city: "M", country: "PH", lat: 1, lng: 2 }, dropoff: { street: "2", city: "C", country: "PH", lat: 1, lng: 2 }, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };
}

describe("AdminAnalyticsPage", () => {
  it("renders KPI cards and the deliveries chart", async () => {
    server.use(http.get("/api/orders", () => HttpResponse.json({ items: [order("completed"), order("completed"), order("cancelled")], nextCursor: null })));
    render(<AdminAnalyticsPage />, { wrapper: QueryWrapper });
    expect(await screen.findByTestId("deliveries-chart")).toBeInTheDocument();
    // success rate = 2/3 = 67%
    expect(screen.getByText("67%")).toBeInTheDocument();
    // total orders
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
