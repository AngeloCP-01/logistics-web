import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// MapLibre needs WebGL (unavailable in jsdom) — replace the lib with light stand-ins.
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, mapStyle }: { children?: ReactNode; mapStyle?: string }) => (
    <div data-testid="map" data-style={mapStyle}>
      {children}
    </div>
  ),
  Source: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Layer: () => <div data-testid="route-layer" />,
  Marker: ({ children }: { children?: ReactNode }) => <div data-testid="marker">{children}</div>,
}));

import { TrackingMap } from "./tracking-map";

const POINT = { orderId: "o1", lat: 14.6, lng: 121.0, ts: "2026-06-17T00:00:00Z" };

describe("TrackingMap", () => {
  it("renders the map with the configured style and a driver + dropoff marker", () => {
    render(<TrackingMap routePoints={[POINT]} latest={POINT} dropoff={{ lat: 14.7, lng: 121.1 }} />);
    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getByTestId("route-layer")).toBeInTheDocument();
    // driver marker + dropoff marker
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("omits the driver marker when there is no latest point", () => {
    render(<TrackingMap routePoints={[]} latest={null} dropoff={{ lat: 14.7, lng: 121.1 }} />);
    // only the dropoff marker
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });
});
