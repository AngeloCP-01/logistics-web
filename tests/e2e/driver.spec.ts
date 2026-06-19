import { test, expect } from "@playwright/test";

const SESSION = { accessToken: "acc", user: { id: "u1", email: "d@x.com", role: "driver" } };
const PROFILE = {
  userId: "u1", role: "driver", displayName: "Dan", phone: null, defaultAddressId: null,
  driver: { vehicleType: "car", licensePlate: "ABC123", isAvailable: false, profileComplete: true },
};

test("a driver lands on Today with an availability control", async ({ page }) => {
  await page.route("**/api/auth/refresh", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) }));
  await page.route("**/api/users/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROFILE) }));
  await page.route("**/api/dispatch/offers/current", (r) => r.fulfill({ status: 204, body: "" }));

  await page.goto("/driver");

  await expect(page.getByRole("heading", { name: /today/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /go online/i })).toBeVisible();
});
