/**
 * Calculate the great-circle distance between two points using the
 * Haversine formula. Returns distance in meters.
 *
 * @param lat1 - Latitude of point 1 (decimal degrees)
 * @param lng1 - Longitude of point 1 (decimal degrees)
 * @param lat2 - Latitude of point 2 (decimal degrees)
 * @param lng2 - Longitude of point 2 (decimal degrees)
 * @returns Distance in meters
 */
export declare function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
/**
 * Format a distance in meters to a human-readable string.
 * Uses km for distances >= 1000m, meters otherwise.
 *
 * @param meters - Distance in meters
 * @param locale - 'en' (default) or 'am' for Amharic
 * @example formatDistance(2300) → "2.3 km"
 * @example formatDistance(450) → "450 m"
 */
export declare function formatDistance(meters: number, locale?: 'en' | 'am'): string;
/**
 * Check if a point is within a given radius of a center point.
 *
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param pointLat - Point latitude
 * @param pointLng - Point longitude
 * @param radiusMeters - Radius in meters
 */
export declare function isWithinRadius(centerLat: number, centerLng: number, pointLat: number, pointLng: number, radiusMeters: number): boolean;
/**
 * Get the bounding box for a given center point and radius.
 * Returns [minLat, minLng, maxLat, maxLng] for use in PostGIS queries.
 */
export declare function getBoundingBox(centerLat: number, centerLng: number, radiusMeters: number): [number, number, number, number];
//# sourceMappingURL=geo.d.ts.map