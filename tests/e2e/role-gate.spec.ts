import { test, expect } from "@playwright/test";

test("unauthenticated visit to a protected route lands on login", async ({ page }) => {
  // BFF refresh returns 401 (no session) so bootstrap completes unauthenticated
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, body: "" }));

  await page.goto("/admin/orders");

  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
