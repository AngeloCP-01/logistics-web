import { test, expect } from "@playwright/test";

const SESSION = { accessToken: "acc", user: { id: "a1", email: "admin@x.com", role: "admin" } };
const ORDER = { id: "oAdmin", customerId: "c1", status: "assigned", pickup: { street: "1 A", city: "Manila", country: "PH", lat: 14.5, lng: 121 }, dropoff: { street: "2 B", city: "Cebu", country: "PH", lat: 14.6, lng: 121.05 }, items: [], assignedDriverId: "d1", scheduledFor: null, cancelReason: null, createdAt: "2026-06-18T00:00:00Z", updatedAt: "2026-06-18T01:00:00Z" };

test("an admin lands on the orders monitoring table", async ({ page }) => {
  await page.route("**/api/auth/refresh", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) }));
  await page.route("**/api/orders**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [ORDER], nextCursor: null }) }));

  await page.goto("/admin/orders");

  await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
  await expect(page.getByText("Cebu")).toBeVisible();
});
