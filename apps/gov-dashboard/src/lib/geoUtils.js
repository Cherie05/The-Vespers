/**
 * Geographic utility functions for spatial calculations and plume projections
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
export function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Compute destination coordinate from origin (lat, lng), bearing (degrees), and distance (km)
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} bearing - Bearing angle clockwise from North (0 - 360)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {[number, number]} [destinationLat, destinationLng]
 */
export function computeDestination(lat, lng, bearing, distanceKm) {
  const d = distanceKm / EARTH_RADIUS_KM;
  const brng = toRad(bearing);
  const lat1 = toRad(lat);
  const lon1 = toRad(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [toDeg(lat2), toDeg(lon2)];
}

/**
 * Compute distance between two coordinates in km (Haversine formula)
 */
export function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
