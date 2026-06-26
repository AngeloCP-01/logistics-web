import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw-server";

// Global mock for react-map-gl/maplibre: prevents maplibre-gl from loading its
// WebWorker blob (which calls window.URL.createObjectURL — absent in jsdom).
// Test files that need richer behaviour (e.g. address-picker.test.tsx) supply
// their own vi.mock("react-map-gl/maplibre", …) which overrides this default.
vi.mock("react-map-gl/maplibre", () => ({
  default: () => null,
  Marker: () => null,
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
