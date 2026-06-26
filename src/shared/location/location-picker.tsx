// src/shared/location/location-picker.tsx
import { useState } from "react";
import Map, { Marker, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { toast } from "sonner";
import { useReverseGeocode, type GeocodedLocation } from "./use-reverse-geocode";
import { Button } from "@/shared/ui/button";

const MAP_STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/dark";
const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 }; // Metro Manila

export function LocationPicker({
  value,
  onChange,
  disabled,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (loc: GeocodedLocation) => void;
  disabled?: boolean;
}): JSX.Element {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(value);
  const geocode = useReverseGeocode();
  const center = pin ?? value ?? DEFAULT_CENTER;
  const zoom = pin ?? value ? 15 : 11;

  function pick(lat: number, lng: number): void {
    setPin({ lat, lng });
    geocode.mutate(
      { lat, lng },
      {
        onSuccess: (loc) => onChange(loc),
        onError: () => {
          toast.error("Couldn't look up the address — fill it in manually.");
          onChange({ lat, lng, street: "", city: "", country: "" });
        },
      },
    );
  }

  function useMyLocation(): void {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation isn't available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      () => toast.error("Couldn't get your location."),
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {pin ? `📍 ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}` : "Tap the map to set the location"}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={useMyLocation}>
          Use my location
        </Button>
      </div>
      <div className="h-64 w-full overflow-hidden rounded-lg border">
        <Map
          initialViewState={{ latitude: center.lat, longitude: center.lng, zoom }}
          mapStyle={MAP_STYLE_URL}
          style={{ width: "100%", height: "100%" }}
          onClick={(e: MapLayerMouseEvent) => {
            if (!disabled) pick(e.lngLat.lat, e.lngLat.lng);
          }}
        >
          {pin && <Marker latitude={pin.lat} longitude={pin.lng} color="#6366f1" />}
        </Map>
      </div>
    </div>
  );
}
