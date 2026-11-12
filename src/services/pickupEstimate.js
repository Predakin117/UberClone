// AI-assisted: see docs/AI_LOG.md #31
// Distance and time from the driver to the pickup point for the request card,
// in a straight line (Haversine) at an average city speed. It never calls
// OpenRouteService: routes are only requested when the request is created and
// when it is accepted (section 7, docs/APIS.md).

export const AVERAGE_SPEED_KMH = 25;

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Straight-line distance in km between two points { latitude, longitude }
 * (the map's format) or { lat, lng } (the trip's format).
 */
export const haversineKm = (from, to) => {
  const lat1 = from.latitude ?? from.lat;
  const lng1 = from.longitude ?? from.lng;
  const lat2 = to.latitude ?? to.lat;
  const lng2 = to.longitude ?? to.lng;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

const hasCoordinates = (point) =>
  Number.isFinite(point?.latitude ?? point?.lat) &&
  Number.isFinite(point?.longitude ?? point?.lng);

/**
 * { km, minutes } from the driver to the pickup point: km with one decimal
 * and minutes rounded up (at least 1). null without both locations.
 */
export const pickupEstimate = (driver, pickup) => {
  if (!hasCoordinates(driver) || !hasCoordinates(pickup)) return null;
  const km = haversineKm(driver, pickup);
  return {
    km: Math.round(km * 10) / 10,
    minutes: Math.max(1, Math.ceil((km / AVERAGE_SPEED_KMH) * 60)),
  };
};
