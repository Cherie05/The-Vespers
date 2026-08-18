// Geodesic math implementation matching apps/gov-dashboard/src/lib/geoUtils.js
const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function computeDestination(lat, lng, bearing, distanceKm) {
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

function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

const PASQUILL_PARAMS = {
  classC: { c: 0.11, d: 0.92 },
  classD: { c: 0.08, d: 0.89 }
};

function calculateSigmaY(xKm, stabilityClass = 'C') {
  const { c, d } = PASQUILL_PARAMS[stabilityClass === 'D' ? 'classD' : 'classC'];
  return c * Math.pow(Math.max(0.1, xKm), d);
}

function generatePlumeFootprint({
  lat,
  lng,
  windSpeed = 15,
  windDirection = 270,
  visualDensity = 7.5,
  maxDistanceKm
}) {
  const downstreamBearing = (windDirection + 180) % 360;
  const totalLengthKm = maxDistanceKm || Math.max(5.0, (windSpeed * 0.8) * (visualDensity / 6.0));
  const steps = 16;
  const leftBoundary = [];
  const rightBoundary = [];

  for (let i = 1; i <= steps; i++) {
    const frac = i / steps;
    const xDist = frac * totalLengthKm;
    const sigmaY = calculateSigmaY(xDist);
    const [centerLat, centerLng] = computeDestination(lat, lng, downstreamBearing, xDist);
    const leftBearing = (downstreamBearing - 90 + 360) % 360;
    const rightBearing = (downstreamBearing + 90) % 360;
    const lateralDistKm = 2.1 * sigmaY * (visualDensity / 7.0);

    leftBoundary.push(computeDestination(centerLat, centerLng, leftBearing, lateralDistKm));
    rightBoundary.push(computeDestination(centerLat, centerLng, rightBearing, lateralDistKm));
  }

  const polygonCoords = [
    [lat, lng],
    ...leftBoundary,
    ...rightBoundary.reverse(),
    [lat, lng]
  ];

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

describe('VesperAero Atmospheric Gaussian Plume Dispersion & Geodesic Physics', () => {
  const originLat = 31.634; // Amritsar, Punjab
  const originLng = 74.872;

  test('1. Haversine distance correctly calculates known distances', () => {
    // Distance from (31.634, 74.872) to (31.520, 74.358) (Amritsar to Lahore) ~ 50 km
    const dist = computeDistanceKm(31.634, 74.872, 31.520, 74.358);
    expect(dist).toBeGreaterThan(45);
    expect(dist).toBeLessThan(55);
  });

  test('2. Geodesic destination calculates accurate forward coordinate', () => {
    // 10 km East (bearing 90)
    const [destLat, destLng] = computeDestination(originLat, originLng, 90, 10);
    const measuredDist = computeDistanceKm(originLat, originLng, destLat, destLng);
    expect(Math.abs(measuredDist - 10)).toBeLessThan(0.01);
  });

  test('3. Pasquill-Gifford dispersion sigma_y increases with downwind distance', () => {
    const sigmaAt1km = calculateSigmaY(1.0, 'C');
    const sigmaAt5km = calculateSigmaY(5.0, 'C');
    const sigmaAt15km = calculateSigmaY(15.0, 'C');

    expect(sigmaAt1km).toBeGreaterThan(0);
    expect(sigmaAt5km).toBeGreaterThan(sigmaAt1km);
    expect(sigmaAt15km).toBeGreaterThan(sigmaAt5km);
  });

  test('4. Generates closed 2D Gaussian plume polygon footprint', () => {
    const footprint = generatePlumeFootprint({
      lat: originLat,
      lng: originLng,
      windSpeed: 18.0,
      windDirection: 270, // Westerly wind (blows towards East 90 deg)
      visualDensity: 8.5
    });

    expect(footprint).toBeDefined();
    expect(footprint.bearing).toBe(90); // (270 + 180) % 360
    expect(footprint.lengthKm).toBeGreaterThan(15);
    expect(footprint.plumePolygon.length).toBe(34); // 16 left + 16 right + start + end
    // First and last coordinates must match origin to close polygon
    expect(footprint.plumePolygon[0]).toEqual([originLat, originLng]);
    expect(footprint.plumePolygon[footprint.plumePolygon.length - 1]).toEqual([originLat, originLng]);
  });

  test('5. Higher optical density score expands plume reach and lateral spread', () => {
    const lightPlume = generatePlumeFootprint({
      lat: originLat,
      lng: originLng,
      windSpeed: 15.0,
      windDirection: 180,
      visualDensity: 3.0
    });

    const heavyPlume = generatePlumeFootprint({
      lat: originLat,
      lng: originLng,
      windSpeed: 15.0,
      windDirection: 180,
      visualDensity: 9.5
    });

    expect(heavyPlume.lengthKm).toBeGreaterThan(lightPlume.lengthKm);
    expect(heavyPlume.maxLateralSpreadKm).toBeGreaterThan(lightPlume.maxLateralSpreadKm);
  });
});
