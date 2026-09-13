// ============================================================================
// Discover — grid-bucket map clustering (HO-J)
// ============================================================================
// Hand-rolled per the LOCKED decision: NO leaflet.markercluster /
// react-leaflet-cluster dependency. Event counts here are in the hundreds —
// a pixel-grid bucket at the current zoom is entirely sufficient.
//
// Algorithm:
//   1. Project each event's (lat, lng) to the map's pixel space at the
//      current zoom (Web Mercator), using Leaflet's projection math
//      re-implemented here as pure functions (no Leaflet import — this
//      module must stay server/testable and dependency-free).
//   2. Bucket points into ~60px square cells.
//   3. Emit one cluster per occupied cell: centroid position, count, ids,
//      and the geographic bounds of the cell (for expand-on-click).
//
// Pure functions throughout — unit-testable without a DOM.
// ============================================================================

import type { DiscoverMapPoint, MapCluster } from './types';

/** Cluster cell size in pixels at the current zoom. */
export const CLUSTER_CELL_PX = 60;

// ---------------------------------------------------------------------------
// Web Mercator projection (matches Leaflet's EPSG:3857 zoom scaling)
// ---------------------------------------------------------------------------

const MAX_LAT = 85.05112878; // Mercator latitude clamp

/** lat → normalized world Y in [0, 1] (top = 0). */
function latToY(lat: number): number {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  const s = Math.sin((clamped * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}

/** lng → normalized world X in [0, 1] (left = 0). */
function lngToX(lng: number): number {
  return (lng + 180) / 360;
}

/** World size in pixels at a given zoom (256px tiles). */
function worldSizePx(zoom: number): number {
  return 256 * Math.pow(2, zoom);
}

// ---------------------------------------------------------------------------
// Clustering
// ---------------------------------------------------------------------------

interface Bucket {
  xs: number[];
  ys: number[];
  points: DiscoverMapPoint[];
}

/**
 * Clusters map points into ~`cellPx` buckets at the given zoom.
 * Singletons pass through as count-1 clusters; cells with >1 point become
 * count badges positioned at the bucket centroid.
 */
export function clusterPoints(
  points: DiscoverMapPoint[],
  zoom: number,
  cellPx: number = CLUSTER_CELL_PX
): MapCluster[] {
  if (points.length === 0) return [];

  const size = worldSizePx(zoom);
  const buckets = new Map<string, Bucket>();

  for (const p of points) {
    const x = lngToX(p.lng) * size;
    const y = latToY(p.lat) * size;
    const cx = Math.floor(x / cellPx);
    const cy = Math.floor(y / cellPx);
    const key = `${cx}:${cy}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.xs.push(x);
      bucket.ys.push(y);
      bucket.points.push(p);
    } else {
      buckets.set(key, { xs: [x], ys: [y], points: [p] });
    }
  }

  const clusters: MapCluster[] = [];
  for (const bucket of buckets.values()) {
    const { points: pts } = bucket;
    const n = pts.length;

    // Cell bounds in pixel space → back to lat/lng for expand-on-click.
    const pxMinX = Math.min(...bucket.xs);
    const pxMaxX = Math.max(...bucket.xs);
    const pxMinY = Math.min(...bucket.ys);
    const pxMaxY = Math.max(...bucket.ys);

    const lngFromX = (x: number) => (x / size) * 360 - 180;
    const latFromY = (y: number) => {
      const nWorld = Math.PI - 2 * Math.PI * (y / size);
      return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nWorld) - Math.exp(-nWorld)));
    };

    clusters.push({
      lat: pts.reduce((acc, p) => acc + p.lat, 0) / n,
      lng: pts.reduce((acc, p) => acc + p.lng, 0) / n,
      count: n,
      eventIds: pts.map((p) => p.id),
      bounds: {
        south: latFromY(pxMaxY),
        west: lngFromX(pxMinX),
        north: latFromY(pxMinY),
        east: lngFromX(pxMaxX),
      },
    });
  }

  return clusters;
}
