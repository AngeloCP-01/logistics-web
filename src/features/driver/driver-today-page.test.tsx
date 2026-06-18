import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { useDriverActiveStore } from "./driver-active-store";
import { DriverTodayPage } from "./driver-today-page";

function profile(opts: { complete: boolean; available?: boolean }) {
  return {
    userId: "u1", role: "driver", displayName: "Dan", phone: null, defaultAddressId: null,
    driver: { vehicleType: opts.complete ? "car" : null, licensePlate: opts.complete ? "ABC123" : null, isAvailable: opts.available ?? false, profileComplete: opts.complete },
  };
}

beforeEach(() => {
  localStorage.clear();
  useDriverActiveStore.getState().clearActive();
  useAuthStore.getState().setSession("t", { id: "u1", email: "d@x.com", role: "driver" });
});

function renderPage() {
  return render(<MemoryRouter><DriverTodayPage /></MemoryRouter>, { wrapper: QueryWrapper });
}

describe("DriverTodayPage", () => {
  it("shows the profile-complete gate when the driver profile is incomplete", async () => {
    server.use(http.get("/api/users/me", () => HttpResponse.json(profile({ complete: false }))));
    renderPage();
    expect(await screen.findByText(/complete your driver profile/i)).toBeInTheDocument();
  });

  it("shows the availability toggle when the profile is complete", async () => {
    server.use(
      http.get("/api/users/me", () => HttpResponse.json(profile({ complete: true, available: false }))),
      http.get("/api/dispatch/offers/current", () => new HttpResponse(null, { status: 204 })),
    );
    renderPage();
    expect(await screen.findByRole("button", { name: /go online/i })).toBeInTheDocument();
  });

  it("surfaces a new offer while online", async () => {
    server.use(
      http.get("/api/users/me", () => HttpResponse.json(profile({ complete: true, available: true }))),
      http.get("/api/dispatch/offers/current", () =>
        HttpResponse.json({ orderId: "o9", offerAttempts: 1, expiresAt: "2026-06-18T12:00:30Z", order: { pickup: { street: "1 A", city: "M", country: "PH", lat: 14, lng: 121 }, dropoff: { street: "2 B", city: "M", country: "PH", lat: 14, lng: 121 }, items: [] } }),
      ),
    );
    renderPage();
    const link = await screen.findByRole("link", { name: /view offer/i });
    expect(link).toHaveAttribute("href", "/driver/offers");
  });
});
