import { test, expect } from "@playwright/test";

const SESSION = { accessToken: "acc", user: { id: "u1", email: "c@x.com", role: "customer" } };
const ADDR = { id: "a1", userId: "u1", label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 };
const ORDER = { id: "oNew", customerId: "u1", status: "created", pickup: { street: "1 A St", city: "Manila", country: "PH", lat: 14, lng: 121 }, dropoff: ADDR, items: [{ description: "Box of books", quantity: 1, weightKg: null }], assignedDriverId: null, scheduledFor: null, cancelReason: null, createdAt: "2026-06-11T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" };

test("a customer can place an order and land on its detail", async ({ page }) => {
  await page.route("**/api/auth/refresh", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) }));
  await page.route("**/api/users/me/addresses", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [ADDR], nextCursor: null }) }));
  // Register the create route FIRST, then the more specific reads — Playwright tries
  // handlers in reverse registration order (last-added wins), so the specific routes
  // registered later take precedence. (The path globs are near-disjoint anyway:
  // "**/api/orders" full-matches only the exact create path, not "/api/orders/me".)
  await page.route("**/api/orders", (r) => r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(ORDER) }));
  await page.route("**/api/orders/me**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) }));
  await page.route("**/api/orders/oNew", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ORDER) }));

  await page.goto("/orders/new");

  await page.getByLabel(/pickup street/i).fill("1 A St");
  await page.getByLabel(/pickup city/i).fill("Manila");
  await page.getByLabel(/pickup country/i).fill("PH");
  await page.getByLabel(/pickup latitude/i).fill("14");
  await page.getByLabel(/pickup longitude/i).fill("121");
  await page.getByLabel(/dropoff address/i).selectOption("a1");
  await page.getByLabel(/item 1 description/i).fill("Box of books");
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/orders\/oNew$/);
  await expect(page.getByText(/Box of books/)).toBeVisible();
});
