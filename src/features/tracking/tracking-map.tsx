import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LatLng, LocationPoint } from "./tracking-types";

const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/dark";

interface TrackingMapProps {
  routePoints: LocationPoint[];
  latest: LocationPoint | null;
  dropoff: LatLng | null;
}

const ROUTE_LINE = {
  type: "line" as const,
  paint: {
    "line-color": "#6366f1", // indigo-500
    "line-width": 4,
  },
};

export function TrackingMap({ routePoints, latest, dropoff }: TrackingMapProps) {
  const center = latest ?? dropoff ?? { lat: 0, lng: 0 };
  const routeGeoJson = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: routePoints.map((p) => [p.lng, p.lat]),
    },
  };

  return (
    <div className="h-80 w-full overflow-hidden rounded-lg">
      <Map
        initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: 13 }}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
      >
        {routePoints.length > 0 && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer id="route-line" {...ROUTE_LINE} />
          </Source>
        )}
        {dropoff && (
          <Marker latitude={dropoff.lat} longitude={dropoff.lng} color="#10b981" />
        )}
        {latest && (
          <Marker latitude={latest.lat} longitude={latest.lng} color="#6366f1" />
        )}
      </Map>
    </div>
  );
}
