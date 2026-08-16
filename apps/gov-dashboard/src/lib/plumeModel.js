import { computeDestination } from './geoUtils';

/**
 * Atmospheric Gaussian Plume Dispersion Modeling Engine
 * Models steady-state atmospheric advection and lateral turbulent dispersion
 */

// Pasquill-Gifford dispersion coefficients for Class C/D (neutral/slightly unstable daytime conditions)
const PASQUILL_PARAMS = {
  classC: { c: 0.11, d: 0.92 },
  classD: { c: 0.08, d: 0.89 }
};

/**
 * Calculate Gaussian lateral dispersion standard deviation sigma_y in km
 * @param {number} xKm - Downwind distance in km
 * @param {string} stabilityClass - 'C' | 'D'
 * @returns {number} Lateral spread sigma_y in km
 */
export function calculateSigmaY(xKm, stabilityClass = 'C') {
  const { c, d } = PASQUILL_PARAMS[stabilityClass === 'D' ? 'classD' : 'classC'];
  return c * Math.pow(Math.max(0.1, xKm), d);
}

/**
 * Generate a 2D Gaussian plume dispersion polygon footprint
 * @param {Object} params
 * @param {number} params.lat - Source emission latitude
 * @param {number} params.lng - Source emission longitude
 * @param {number} params.windSpeed - Wind speed in km/h
 * @param {number} params.windDirection - Wind direction degrees (0-360)
 * @param {number} params.visualDensity - Score 1-10 from Gemini Vision
 * @param {number} params.maxDistanceKm - Optional override for plume length
 * @returns {Object} Plume geometry layers and metadata
 */
export function generatePlumeFootprint({
  lat,
  lng,
  windSpeed = 15,
  windDirection = 270,
  visualDensity = 7.5,
  maxDistanceKm
}) {
  // Downwind vector: wind blows FROM windDirection, so plume drifts towards (windDirection + 180) % 360
  const downstreamBearing = (windDirection + 180) % 360;

  // Plume reach is proportional to wind velocity and source density
  const totalLengthKm = maxDistanceKm || Math.max(5.0, (windSpeed * 0.8) * (visualDensity / 6.0));

  // Build polygon boundary points along the downwind axis
  const steps = 16;
  const leftBoundary = [];
  const rightBoundary = [];

  for (let i = 1; i <= steps; i++) {
    const frac = i / steps;
    const xDist = frac * totalLengthKm;
    const sigmaY = calculateSigmaY(xDist);

    // Compute centerline coordinate at distance xDist
    const [centerLat, centerLng] = computeDestination(lat, lng, downstreamBearing, xDist);

    // Lateral crosswind bearing (perpendicular: left is -90 deg, right is +90 deg)
    const leftBearing = (downstreamBearing - 90 + 360) % 360;
    const rightBearing = (downstreamBearing + 90) % 360;

    // Outer boundary points at 2 * sigma_y (encloses ~95% of emission mass)
    const lateralDistKm = 2.1 * sigmaY * (visualDensity / 7.0);

    const leftPoint = computeDestination(centerLat, centerLng, leftBearing, lateralDistKm);
    const rightPoint = computeDestination(centerLat, centerLng, rightBearing, lateralDistKm);

    leftBoundary.push(leftPoint);
    rightBoundary.push(rightPoint);
  }

  // Combine into a closed polygon starting at source (lat, lng)
  const polygonCoords = [
    [lat, lng],
    ...leftBoundary,
    ...rightBoundary.reverse(),
    [lat, lng]
  ];

  // Core high-concentration inner cone
  const coreLengthKm = totalLengthKm * 0.45;
  const coreLeft = [];
  const coreRight = [];
  for (let i = 1; i <= 8; i++) {
    const frac = i / 8;
    const xDist = frac * coreLengthKm;
    const sigmaY = calculateSigmaY(xDist) * 0.55;
    const [centerLat, centerLng] = computeDestination(lat, lng, downstreamBearing, xDist);
    const leftBearing = (downstreamBearing - 90 + 360) % 360;
    const rightBearing = (downstreamBearing + 90) % 360;

    coreLeft.push(computeDestination(centerLat, centerLng, leftBearing, sigmaY));
    coreRight.push(computeDestination(centerLat, centerLng, rightBearing, sigmaY));
  }

  const corePolygonCoords = [
    [lat, lng],
    ...coreLeft,
    ...coreRight.reverse(),
    [lat, lng]
  ];

  // Plume vector endpoint
  const [endLat, endLng] = computeDestination(lat, lng, downstreamBearing, totalLengthKm);

  return {
    plumePolygon: polygonCoords,
    corePolygon: corePolygonCoords,
    vectorLine: [
      [lat, lng],
      [endLat, endLng]
    ],
    bearing: downstreamBearing,
    lengthKm: Math.round(totalLengthKm * 10) / 10,
    maxLateralSpreadKm: Math.round(calculateSigmaY(totalLengthKm) * 4.2 * 10) / 10
  };
}
