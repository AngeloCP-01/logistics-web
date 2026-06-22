import { test, expect } from "@playwright/test";

const SESSION = { accessToken: "acc", user: { id: "u1", email: "c@x.com", role: "customer" } };
const PROFILE = { userId: "u1", role: "customer", displayName: "Cara Customer", phone: "0917 000 0000", defaultAddressId: null, driver: null };

test("a customer can open their profile", async ({ page }) => {
  await page.route("**/api/auth/refresh", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) }));
  await page.route("**/api/users/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROFILE) }));
  await page.route("**/api/users/me/addresses", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) }));
  await page.route("**/api/notifications**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) }));

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: /^profile$/i })).toBeVisible();
  await expect(page.getByLabel(/display name/i)).toHaveValue("Cara Customer");
});
