import { defineConfig, devices } from "@playwright/test";

// The demo run is NOT part of CI. It drives the LIVE local stack (not the
// hermetic MSW smokes in tests/e2e) and records video + screenshots into
// docs/demo for the portfolio walkthrough.
export default defineConfig({
  testDir: "./tests/demo",
  testMatch: "**/*.demo.ts",
  outputDir: "./test-results/demo",
  timeout: 180_000,
  use: {
    baseURL: "http://localhost:5173",
    video: "on",
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
