"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// ============================================================================
// Leaflet Map — Client-Only Component
// ============================================================================
// Imported via next/dynamic with ssr:false to prevent window errors.
// Guards null lat/lng gracefully.
// ============================================================================

/** Dynamic imports of react-leaflet components — `any` is unavoidable here
 *  because react-leaflet's generic ForwardRefExoticComponent types are
 *  incompatible with any generic wrapper. Type safety is enforced at the
 *  JSX call site where concrete props are passed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletComponent = React.ComponentType<any>;

interface LeafletComponents {
  MapContainer: LeafletComponent;
  TileLayer: LeafletComponent;
  Marker: LeafletComponent;
  Popup: LeafletComponent;
}

interface LeafletMapProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  zoom?: number;
  className?: string;
  height?: string;
}

/**
 * Inner map component — only rendered client-side.
 * Uses react-leaflet to render an OpenStreetMap tile layer.
 */
function LeafletMapInner({ lat, lng, title, address, zoom = 15, className, height = "300px" }: LeafletMapProps) {
  const [components, setComponents] = React.useState<LeafletComponents | null>(null);
  const [icon, setIcon] = React.useState<InstanceType<typeof import("leaflet").Icon> | null>(null);

  React.useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([rl, L]) => {
      setComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
      });
      setIcon(
        new L.Icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
    });
  }, []);

  if (!components || !icon) {
    return (
      <div
        className={cn("bg-muted rounded-xl flex items-center justify-center", className)}
        style={{ height }}
      >
        <div className="animate-pulse text-muted-foreground text-sm">Loading map…</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = components;

  return (
    <div className={cn("rounded-xl overflow-hidden", className)} style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            {title && <strong className="block text-sm">{title}</strong>}
            {address && <span className="text-xs text-muted-foreground">{address}</span>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// ============================================================================
// Public component — guards null coordinates, falls back to address-only
// ============================================================================

interface VenueMapProps {
  lat: number | null;
  lng: number | null;
  title?: string;
  address?: string;
  zoom?: number;
  className?: string;
  height?: string;
}

export function VenueMap({ lat, lng, title, address, zoom, className, height }: VenueMapProps) {
  // Guard: no coordinates → show address-only fallback
  if (lat == null || lng == null || (lat === 0 && lng === 0)) {
    return (
      <div className={cn("bg-muted rounded-xl overflow-hidden", className)}>
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          {title && <p className="text-sm font-medium text-center">{title}</p>}
          {address && <p className="text-xs text-muted-foreground text-center">{address}</p>}
          <p className="text-xs text-muted-foreground">Map not available for this location</p>
        </div>
      </div>
    );
  }

  return (
    <LeafletMapInner
      lat={lat}
      lng={lng}
      title={title}
      address={address}
      zoom={zoom}
      className={className}
      height={height}
    />
  );
}
