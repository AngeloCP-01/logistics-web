import { test, expect } from "@playwright/test";

const SESSION = { accessToken: "acc", user: { id: "u1", email: "c@x.com", role: "customer" } };
const ORDER = {
  id: "oTrack",
  customerId: "u1",
  status: "in_transit",
  pickup: { street: "1 A St", city: "Manila", country: "PH", lat: 14.5, lng: 121.0 },
  dropoff: { label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121.05 },
  items: [{ description: "Box", quantity: 1, weightKg: null }],
  assignedDriverId: "d1",
  scheduledFor: null,
  cancelReason: null,
  createdAt: "2026-06-17T00:00:00Z",
  updatedAt: "2026-06-17T00:00:00Z",
};

test("a customer can open live tracking and see the waiting state", async ({ page }) => {
  await page.route("**/api/auth/refresh", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) }),
  );
  await page.route("**/api/orders/oTrack", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ORDER) }),
  );
  await page.route("**/api/tracking/orders/oTrack/route", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) }),
  );
  await page.route("**/api/tracking/orders/oTrack/latest", (r) =>
    r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ title: "none", status: 404 }) }),
  );

  await page.goto("/track/oTrack");

  await expect(page.getByRole("heading", { name: /track delivery/i })).toBeVisible();
  await expect(page.getByText(/waiting for the driver/i)).toBeVisible();
});
