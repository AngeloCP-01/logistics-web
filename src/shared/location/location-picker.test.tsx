// src/shared/location/location-picker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";

// MapLibre needs WebGL (unavailable in jsdom). The stub Map fires the picker's
// onClick with a fixed coordinate when its surface is clicked.
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: { children?: ReactNode; onClick?: (e: { lngLat: { lat: number; lng: number } }) => void }) => (
    <div data-testid="map" onClick={() => onClick?.({ lngLat: { lat: 14.5574, lng: 121.0089 } })}>
      {children}
    </div>
  ),
  Marker: () => <div data-testid="pin" />,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { LocationPicker } from "./location-picker";

const GEO = { lat: 14.5574, lng: 121.0089, street: "Dela Rosa", city: "Makati", country: "PH" };

beforeEach(() => {
  server.use(http.get("/api/geocode/reverse", () => HttpResponse.json(GEO)));
});

describe("LocationPicker", () => {
  it("clicking the map drops a pin and emits the geocoded location", async () => {
    const onChange = vi.fn();
    render(<LocationPicker value={null} onChange={onChange} />, { wrapper: QueryWrapper });
    await userEvent.click(screen.getByTestId("map"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(GEO));
    expect(screen.getByTestId("pin")).toBeInTheDocument();
  });

  it("emits coordinates with empty address fields when geocoding fails", async () => {
    server.use(http.get("/api/geocode/reverse", () => new HttpResponse(null, { status: 502 })));
    const onChange = vi.fn();
    render(<LocationPicker value={null} onChange={onChange} />, { wrapper: QueryWrapper });
    await userEvent.click(screen.getByTestId("map"));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ lat: 14.5574, lng: 121.0089, street: "", city: "", country: "" }),
    );
  });

  it("uses the browser geolocation when 'Use my location' is clicked", async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: 14.5574, longitude: 121.0089 } } as GeolocationPosition),
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    const onChange = vi.fn();
    render(<LocationPicker value={null} onChange={onChange} />, { wrapper: QueryWrapper });
    await userEvent.click(screen.getByRole("button", { name: /use my location/i }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(GEO));
    vi.unstubAllGlobals();
  });
});
