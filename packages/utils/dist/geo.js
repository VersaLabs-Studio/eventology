// ============================================================================
// @eventology/utils — Geo Utilities
// ============================================================================
/** Earth's mean radius in meters (WGS84) */
const EARTH_RADIUS_M = 6_371_008.8;
/**
 * Convert degrees to radians.
 */
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
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
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_M * c;
}
/**
 * Format a distance in meters to a human-readable string.
 * Uses km for distances >= 1000m, meters otherwise.
 *
 * @param meters - Distance in meters
 * @param locale - 'en' (default) or 'am' for Amharic
 * @example formatDistance(2300) → "2.3 km"
 * @example formatDistance(450) → "450 m"
 */
export function formatDistance(meters, locale = 'en') {
    if (meters < 1) {
        return locale === 'am' ? '0 ሜ' : '0 m';
    }
    if (meters >= 1000) {
        const km = (meters / 1000).toFixed(1);
        return locale === 'am' ? `${km} ኪ.ሜ` : `${km} km`;
    }
    const rounded = Math.round(meters);
    return locale === 'am' ? `${rounded} ሜ` : `${rounded} m`;
}
/**
 * Check if a point is within a given radius of a center point.
 *
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param pointLat - Point latitude
 * @param pointLng - Point longitude
 * @param radiusMeters - Radius in meters
 */
export function isWithinRadius(centerLat, centerLng, pointLat, pointLng, radiusMeters) {
    return calculateDistance(centerLat, centerLng, pointLat, pointLng) <= radiusMeters;
}
/**
 * Get the bounding box for a given center point and radius.
 * Returns [minLat, minLng, maxLat, maxLng] for use in PostGIS queries.
 */
export function getBoundingBox(centerLat, centerLng, radiusMeters) {
    const latDelta = radiusMeters / 111_320; // ~111.32 km per degree latitude
    const lngDelta = radiusMeters / (111_320 * Math.cos(toRad(centerLat)));
    return [
        centerLat - latDelta,
        centerLng - lngDelta,
        centerLat + latDelta,
        centerLng + lngDelta,
    ];
}
//# sourceMappingURL=geo.js.map