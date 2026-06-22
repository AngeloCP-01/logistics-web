import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "node:fs";

// END-TO-END DEMO — drives the LIVE local stack (not hermetic). Records video
// (via playwright.demo.config.ts) and captures a named screenshot at each key
// screen into docs/demo/screenshots. Run with: npm run demo:e2e
// Prereqs: full local stack up (RUNBOOK) + seeded accounts + a saved customer
// address. The customer places an order, the driver (real app) goes online →
// accepts → runs the delivery streaming geolocation, and the customer watches
// it live and sees completion.
//
// Navigation is kept CLIENT-SIDE after login (in-app links/buttons, no page
// reloads): the access token lives in memory, so a full reload would depend on
// the silent-refresh path — clicking through is both more realistic and robust.

const SHOTS = "docs/demo/screenshots";
fs.mkdirSync(SHOTS, { recursive: true });
const shot = (p: Page, name: string) => p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

const CUSTOMER = { email: "customer@logistics.local", password: "Customer12345!" };
const DRIVER = { email: "driver@logistics.local", password: "Driver12345!" };

const PICKUP = { lat: 14.5995, lng: 120.9842 };
const DROPOFF = { lat: 14.676, lng: 121.0437 };

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("full delivery lifecycle: customer places, driver delivers, customer tracks live", async ({ browser }) => {
  // Manually-created contexts don't inherit `use.video`, so record explicitly.
  const customerCtx = await browser.newContext({
    recordVideo: { dir: "test-results/demo/video", size: { width: 1280, height: 720 } },
  });
  // Driver context gets geolocation so the real driver app can stream position.
  const driverCtx: BrowserContext = await browser.newContext({
    permissions: ["geolocation"],
    geolocation: { latitude: PICKUP.lat, longitude: PICKUP.lng },
    recordVideo: { dir: "test-results/demo/video", size: { width: 1280, height: 720 } },
  });
  const cust = await customerCtx.newPage();
  const drv = await driverCtx.newPage();

  // 1. Customer logs in and lands on Home.
  await login(cust, CUSTOMER.email, CUSTOMER.password);
  await expect(cust.getByRole("button", { name: /place order/i }).first()).toBeVisible({ timeout: 15_000 });
  await shot(cust, "01-customer-home");

  // 2. Customer places an order (navigate via the in-app CTA).
  await cust.getByRole("button", { name: /place order/i }).first().click();
  await expect(cust).toHaveURL(/\/orders\/new$/, { timeout: 10_000 });
  await cust.getByLabel(/pickup street/i).fill("1 Rizal Ave");
  await cust.getByLabel(/pickup city/i).fill("Manila");
  await cust.getByLabel(/pickup country/i).fill("PH");
  await cust.getByLabel(/pickup latitude/i).fill(String(PICKUP.lat));
  await cust.getByLabel(/pickup longitude/i).fill(String(PICKUP.lng));
  await cust.getByLabel(/dropoff address/i).selectOption({ index: 1 });
  await cust.getByLabel(/item 1 description/i).fill("Birthday gift");
  await shot(cust, "02-place-order");
  await cust.getByRole("button", { name: /place order/i }).click();

  await expect(cust).toHaveURL(/\/orders\/[0-9a-f-]+$/, { timeout: 15_000 });
  await shot(cust, "03-order-detail");

  // 3. Driver logs in → Today (login redirects client-side to the role home).
  await login(drv, DRIVER.email, DRIVER.password);
  await expect(drv.getByRole("heading", { name: /today/i })).toBeVisible({ timeout: 15_000 });
  await shot(drv, "04-driver-today");

  // 4. Driver goes online → dispatch offers the parked order.
  await drv.getByRole("button", { name: /go online/i }).click();
  await expect(drv.getByText(/new delivery offer/i)).toBeVisible({ timeout: 40_000 });
  await shot(drv, "05-driver-offer-waiting");

  // 5. Driver views + accepts the offer.
  await drv.getByRole("link", { name: /view offer/i }).click();
  await expect(drv.getByRole("heading", { name: /incoming offer/i })).toBeVisible({ timeout: 15_000 });
  await shot(drv, "06-driver-offer");
  await drv.getByRole("button", { name: /^accept$/i }).click();
  await expect(drv.getByRole("heading", { name: /active delivery/i })).toBeVisible({ timeout: 15_000 });
  await shot(drv, "07-driver-active");

  // 6. Customer reaches live tracking via the in-app Home → Track button
  //    (the order is now "assigned", so Home's active banner shows Track).
  await cust.getByRole("link", { name: /^home$/i }).click();
  await expect(cust).toHaveURL(/\/$/, { timeout: 10_000 });
  await cust.getByRole("button", { name: /^track$/i }).click();
  await expect(cust.getByRole("heading", { name: /track delivery/i })).toBeVisible({ timeout: 15_000 });
  await cust.waitForTimeout(2_000);
  await shot(cust, "08-customer-tracking");

  // 7. Driver marks picked up → in_transit, then streams movement toward dropoff.
  await drv.getByRole("button", { name: /picked up/i }).click();
  await expect(drv.getByRole("button", { name: /delivered/i })).toBeVisible({ timeout: 15_000 });
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    await driverCtx.setGeolocation({
      latitude: PICKUP.lat + (DROPOFF.lat - PICKUP.lat) * t,
      longitude: PICKUP.lng + (DROPOFF.lng - PICKUP.lng) * t,
    });
    await drv.waitForTimeout(1_500);
  }
  await cust.waitForTimeout(2_000);
  await shot(cust, "09-customer-tracking-live");

  // 8. Driver completes the delivery; customer sees completion (pushed over WS).
  await drv.getByRole("button", { name: /delivered/i }).click();
  await expect(drv.getByText(/delivery complete/i)).toBeVisible({ timeout: 15_000 });
  await shot(drv, "10-driver-complete");

  await cust.waitForTimeout(3_000);
  await shot(cust, "11-customer-delivered");

  // Save the recorded videos to docs/demo (saveAs resolves after close).
  const custVideo = cust.video();
  const drvVideo = drv.video();
  await customerCtx.close();
  await driverCtx.close();
  if (custVideo) await custVideo.saveAs("docs/demo/lifecycle-customer.webm");
  if (drvVideo) await drvVideo.saveAs("docs/demo/lifecycle-driver.webm");
});
