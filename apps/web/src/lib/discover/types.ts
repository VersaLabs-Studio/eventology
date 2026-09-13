// ============================================================================
// Discover — derived types (HO-J)
// ============================================================================
// Pure presentation over data already modeled. No new tables, no new
// endpoints (LOCKED decision). These types shape the hub's client-side
// composition only.
// ============================================================================

import type { Event } from '@/lib/types';

/** What a rail renders / how it sources its data. */
export type DiscoverRailKind =
  | 'weekend'
  | 'nearby'
  | 'for-you'
  | 'trending'
  | 'collections';

/** A curated rail on the /discover hub. */
export interface DiscoverRail {
  id: string;
  /** i18n key under discover.* for the rail heading. */
  titleKey: string;
  kind: DiscoverRailKind;
  events: Event[];
}

/** Events with coordinates ready for the map, transformed for display. */
export interface DiscoverMapPoint {
  id: string;
  slug: string;
  title: string;
  /** Display-ready card data (for the pin popup + list equivalent). */
  event: Event;
  lat: number;
  lng: number;
  /** Meters, from the nearby RPC — used to sort the list equivalent. */
  distanceM: number | null;
}

/** A grid-bucket cluster of overlapping pins at the current zoom. */
export interface MapCluster {
  /** Cluster marker position — the cell's centroid. */
  lat: number;
  lng: number;
  /** Total events in the bucket; >1 renders a count badge. */
  count: number;
  eventIds: string[];
  /** Cell bounds (lat/lng), used to fly/zoom in on expand. */
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
}
