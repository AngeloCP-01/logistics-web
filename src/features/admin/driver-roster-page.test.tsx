import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { DriverRosterPage } from "./driver-roster-page";

describe("DriverRosterPage", () => {
  it("lists the currently-online drivers", async () => {
    server.use(http.get("/api/dispatch/drivers/available", () => HttpResponse.json({ items: [
      { driverId: "d1", displayName: "Dan Driver", vehicleType: "car", availableSince: "2026-06-18T00:00:00Z" },
      { driverId: "d2", displayName: "Mia Mover", vehicleType: null, availableSince: "2026-06-18T02:00:00Z" },
    ] })));
    render(<DriverRosterPage />, { wrapper: QueryWrapper });
    expect(await screen.findByText("Dan Driver")).toBeInTheDocument();
    expect(screen.getByText("Mia Mover")).toBeInTheDocument();
  });

  it("shows an empty state when no drivers are online", async () => {
    server.use(http.get("/api/dispatch/drivers/available", () => HttpResponse.json({ items: [] })));
    render(<DriverRosterPage />, { wrapper: QueryWrapper });
    expect(await screen.findByText(/no drivers are online/i)).toBeInTheDocument();
  });
});
