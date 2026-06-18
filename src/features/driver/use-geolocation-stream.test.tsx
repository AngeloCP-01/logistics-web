import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGeolocationStream } from "./use-geolocation-stream";

const watchPosition = vi.fn();
const clearWatch = vi.fn();

beforeEach(() => {
  watchPosition.mockReset().mockReturnValue(42);
  clearWatch.mockReset();
  vi.stubGlobal("navigator", { geolocation: { watchPosition, clearWatch } });
});

describe("useGeolocationStream", () => {
  it("does not watch when disabled", () => {
    renderHook(() => useGeolocationStream(false, () => {}));
    expect(watchPosition).not.toHaveBeenCalled();
  });

  it("delivers positions while enabled", () => {
    const onPosition = vi.fn();
    watchPosition.mockImplementation((success: PositionCallback) => {
      success({ coords: { latitude: 14.5, longitude: 121.0, accuracy: 8 } } as GeolocationPosition);
      return 42;
    });
    renderHook(() => useGeolocationStream(true, onPosition));
    expect(onPosition).toHaveBeenCalledWith({ lat: 14.5, lng: 121.0, accuracy: 8 });
  });

  it("clears the watch on unmount", () => {
    const { unmount } = renderHook(() => useGeolocationStream(true, () => {}));
    unmount();
    expect(clearWatch).toHaveBeenCalledWith(42);
  });
});
