'use client';

// ============================================================================
// NearbyMapBrowse — map + list discovery (HO-J)
// ============================================================================
// Reuses the EXISTING Leaflet stack (leaflet + react-leaflet — LOCKED: no
// new map dependency), copying venue-map.tsx's dynamic-import/SSR-guard
// pattern exactly: react-leaflet components are imported inside useEffect
// and held in state, so Leaflet never touches `window` during SSR.
//
// Clustering is HAND-ROLLED (src/lib/discover/cluster.ts) — grid buckets at
// the current zoom; count badge for >1; expand-on-click flies to the cell
// bounds. No leaflet.markercluster (LOCKED).
//
// Accessibility: the map is paired with a keyboard-navigable list
// equivalent (same events, nearest-first) — a map alone is not AA.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, Map as MapIcon, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { DiscoverKeys } from "@eventology/config";
import { clusterPoints } from "@/lib/discover/cluster";
import type { DiscoverMapPoint } from "@/lib/discover/types";
import { transformEvent } from "@/lib/transformers";
import { useLocale } from "@/lib/i18n";
import "leaflet/dist/leaflet.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletComponent = React.ComponentType<any>;

interface LeafletComponents {
  MapContainer: LeafletComponent;
  TileLayer: LeafletComponent;
  Marker: LeafletComponent;
  Popup: LeafletComponent;
  useMapEvents: (handlers: Record<string, (e: unknown) => void>) => LeafletMapLike | null;
}

interface LeafletMapLike {
  flyToBounds: (bounds: [[number, number], [number, number]], options?: object) => void;
  getZoom: () => number;
}

/** Addis Ababa center — the platform's home city. */
const DEFAULT_CENTER: [number, number] = [9.0192, 38.7525];
const DEFAULT_ZOOM = 12;

/** Geolocates once, falls back to the Addis center on denial/unavailability. */
function useBrowserCenter() {
  const [center, setCenter] = React.useState<[number, number] | null>(null);

  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let settled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        settled = true;
        setCenter([pos.coords.latitude, pos.coords.longitude]);
      },
      () => setCenter((c) => c ?? DEFAULT_CENTER),
      { timeout: 8000 }
    );
    const fallback = setTimeout(() => {
      if (!settled) setCenter((c) => c ?? DEFAULT_CENTER);
    }, 9000);
    return () => clearTimeout(fallback);
  }, []);

  return center ?? DEFAULT_CENTER;
}

export function NearbyMapBrowse() {
  const { t } = useLocale();
  const router = useRouter();
  const center = useBrowserCenter();
  const [view, setView] = React.useState<"map" | "list">("map");
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM);

  const bbox = center.map((c) => c.toFixed(4)).join(",") as string;

  // Existing PostGIS nearby endpoint (034): approved + upcoming, nearest first.
  const q = useQuery<{ data: Array<Record<string, unknown>> }>({
    queryKey: DiscoverKeys.nearby(bbox),
    queryFn: async () => {
      const res = await fetch(
        `/api/public/events/nearby?lat=${center[0]}&lng=${center[1]}&radius=25&limit=40`
      );
      if (!res.ok) throw new Error("nearby load failed");
      return res.json();
    },
  });

  const points: DiscoverMapPoint[] = React.useMemo(() => {
    const rows = q.data?.data ?? [];
    return rows
      .map((row) => {
        const lat = row.latitude as number | null;
        const lng = row.longitude as number | null;
        if (lat == null || lng == null) return null;
        return {
          id: row.id as string,
          slug: row.slug as string,
          title: row.title as string,
          event: transformEvent(row as Parameters<typeof transformEvent>[0]),
          lat,
          lng,
          distanceM: (row.distance_m as number | null) ?? null,
        } satisfies DiscoverMapPoint;
      })
      .filter((p): p is DiscoverMapPoint => p !== null);
  }, [q.data]);

  const clusters = React.useMemo(() => clusterPoints(points, zoom), [points, zoom]);

  const loading = q.isLoading;
  if (q.isError) return null; // fail independently — omit the section

  return (
    <section className="space-y-4" aria-label={t("discover.nearbyTitle")}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display font-bold text-xl flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {t("discover.nearbyTitle")}
        </h2>
        <div className="flex items-center gap-1 rounded-xl border border-border p-1">
          <Button
            variant={view === "map" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
          >
            <MapIcon className="h-4 w-4 mr-1.5" />
            {t("discover.mapView")}
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4 mr-1.5" />
            {t("discover.listView")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-[420px] rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("common.loading")}
        </div>
      ) : view === "map" ? (
        <NearbyLeafletMap
          center={center}
          zoom={zoom}
          onZoom={setZoom}
          clusters={clusters}
          points={points}
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label={t("discover.listView")}>
          {points.slice(0, 20).map((p) => (
            <li key={p.id}>
              <Link
                href={`/events/${p.slug}`}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {p.event.location}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-primary">
                  {p.distanceM != null
                    ? p.distanceM >= 1000
                      ? `${(p.distanceM / 1000).toFixed(1)} km`
                      : `${Math.round(p.distanceM)} m`
                    : ""}
                </span>
              </Link>
            </li>
          ))}
          {points.length === 0 && (
            <li className="col-span-full text-sm text-muted-foreground py-8 text-center rounded-xl bg-muted/30">
              {t("discover.noNearby")}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Inner Leaflet map — client-only, dynamic-import guarded (venue-map pattern)
// ---------------------------------------------------------------------------

function NearbyLeafletMap({
  center,
  zoom,
  onZoom,
  clusters,
  points,
}: {
  center: [number, number];
  zoom: number;
  onZoom: (z: number) => void;
  clusters: ReturnType<typeof clusterPoints>;
  points: DiscoverMapPoint[];
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [components, setComponents] = React.useState<LeafletComponents | null>(null);
  const [icon, setIcon] = React.useState<InstanceType<typeof import("leaflet").Icon> | null>(null);
  const [L, setL] = React.useState<typeof import("leaflet") | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, leaflet]) => {
      setComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        useMapEvents: rl.useMapEvents as LeafletComponents["useMapEvents"],
      });
      setL(leaflet);
      setIcon(
        new leaflet.Icon({
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

  if (!components || !icon || !L) {
    return (
      <div className="h-[420px] rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">
        {t("common.loading")}
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = components;

  /** Count-badge icon for multi-event clusters (hand-rolled, zero-dep).
   *  Tailwind semantic tokens only — bg-primary/text-primary-foreground are
   *  already generated by the app shell, so dark mode adapts. */
  const clusterIcon = React.useMemo(() => {
    return (count: number) =>
      L.divIcon({
        className: "discover-cluster-badge",
        html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-extrabold text-[13px] shadow-lg ring-2 ring-background">${count}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
  }, [L]);

  /** Tracks zoom so clustering re-buckets at the current scale. */
  function ZoomTracker() {
    const useMapEvents = components!.useMapEvents;
    const map = useMapEvents({
      zoomend: (e: unknown) => {
        const target = e as { target?: { getZoom?: () => number } };
        onZoom(target.target?.getZoom?.() ?? zoom);
      },
    });
    React.useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  }

  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border border-border/60">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomTracker />

        {clusters.map((c) =>
          c.count === 1 ? (
            <Marker
              key={c.eventIds[0]}
              position={[c.lat, c.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  const p = points.find((pt) => pt.id === c.eventIds[0]);
                  if (p) router.push(`/events/${p.slug}`);
                },
              }}
            >
              <Popup>
                <strong className="block text-sm">
                  {points.find((pt) => pt.id === c.eventIds[0])?.title ?? ""}
                </strong>
              </Popup>
            </Marker>
          ) : (
            <Marker
              key={`cluster-${c.lat}-${c.lng}`}
              position={[c.lat, c.lng]}
              icon={clusterIcon(c.count)}
              eventHandlers={{
                click: () => {
                  mapRef.current?.flyToBounds(
                    [
                      [c.bounds.south, c.bounds.west],
                      [c.bounds.north, c.bounds.east],
                    ],
                    { padding: [40, 40] }
                  );
                },
              }}
            >
              <Popup>
                <span className="font-bold">{t("discover.clusterCount", { count: c.count })}</span>
                <br />
                <span className="text-xs text-muted-foreground">{t("discover.clusterExpandHint")}</span>
              </Popup>
            </Marker>
          )
        )}
      </MapContainer>
      <p className="sr-only">{t("discover.mapA11yNote")}</p>
    </div>
  );
}
