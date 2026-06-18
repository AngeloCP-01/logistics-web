import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { useDriverActiveStore } from "./driver-active-store";
import { OfferPage } from "./offer-page";

const OFFER = {
  orderId: "o1", offerAttempts: 1, expiresAt: "2999-01-01T00:00:00Z",
  order: { pickup: { street: "1 Pickup", city: "Manila", country: "PH", lat: 14.5, lng: 121 }, dropoff: { street: "2 Dropoff", city: "Manila", country: "PH", lat: 14.6, lng: 121.05 }, items: [{ description: "Box", quantity: 2, weightKg: null }] },
};

beforeEach(() => {
  localStorage.clear();
  useDriverActiveStore.getState().clearActive();
  useAuthStore.getState().setSession("t", { id: "u1", email: "d@x.com", role: "driver" });
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/driver/offers"]}>
      <Routes>
        <Route path="/driver" element={<div>Today screen</div>} />
        <Route path="/driver/offers" element={<OfferPage />} />
        <Route path="/driver/active/:orderId" element={<div>Active screen</div>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: QueryWrapper },
  );
}

describe("OfferPage", () => {
  it("shows the offer details", async () => {
    server.use(http.get("/api/dispatch/offers/current", () => HttpResponse.json(OFFER)));
    renderPage();
    expect(await screen.findByText(/2 Dropoff/)).toBeInTheDocument();
    expect(screen.getByText(/Box/)).toBeInTheDocument();
  });

  it("accepts and navigates to the active delivery, recording the active order", async () => {
    server.use(
      http.get("/api/dispatch/offers/current", () => HttpResponse.json(OFFER)),
      http.post("/api/dispatch/assignments/o1/accept", () => new HttpResponse(null, { status: 204 })),
    );
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /accept/i }));
    expect(await screen.findByText(/active screen/i)).toBeInTheDocument();
    expect(useDriverActiveStore.getState().activeOrderId).toBe("o1");
  });

  it("rejects and returns to Today", async () => {
    server.use(
      http.get("/api/dispatch/offers/current", () => HttpResponse.json(OFFER)),
      http.post("/api/dispatch/assignments/o1/reject", () => new HttpResponse(null, { status: 204 })),
    );
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /reject/i }));
    expect(await screen.findByText(/today screen/i)).toBeInTheDocument();
  });

  it("shows an empty state when there is no offer", async () => {
    server.use(http.get("/api/dispatch/offers/current", () => new HttpResponse(null, { status: 204 })));
    renderPage();
    expect(await screen.findByText(/no current offer/i)).toBeInTheDocument();
  });
});
