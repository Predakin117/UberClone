// AI-assisted: see docs/AI_LOG.md #21, #29
// Coordenadas para dibujar las rutas del viaje en react-native-maps
// (docs/APIS.md, servicio 2). Las polylines vienen de OpenRouteService; si una
// falta, se dibuja una línea recta entre los dos puntos.
import polyline from "@mapbox/polyline";
import { TRIP_STATUS } from "./trips";

const toPoint = ({ lat, lng }) => ({ latitude: lat, longitude: lng });

// decode devuelve pares [lat, lng]; el mapa usa { latitude, longitude }.
// Devuelve null si la polyline no sirve para dibujar una ruta.
const decodePolyline = (encoded) => {
  if (!encoded) return null;
  try {
    const points = polyline
      .decode(encoded)
      .map(([latitude, longitude]) => ({ latitude, longitude }));
    return points.length >= 2 ? points : null;
  } catch {
    return null;
  }
};

/**
 * Ruta del viaje, de origen a destino: { coordinates, isReal }. isReal es false
 * cuando routePolyline es null y se usa la línea recta.
 */
export const tripRoute = (trip) => {
  const points = decodePolyline(trip.routePolyline);
  return points
    ? { coordinates: points, isReal: true }
    : { coordinates: [toPoint(trip.origin), toPoint(trip.destination)], isReal: false };
};

/**
 * Ruta del conductor hasta el punto de recogida: { coordinates, isReal }.
 * driver y origin son { lat, lng }; result es la respuesta de fetchRoute.
 */
export const pickupRoute = (driver, origin, result) => {
  const points = result?.ok ? decodePolyline(result.encodedPolyline) : null;
  return points
    ? { coordinates: points, isReal: true }
    : { coordinates: [toPoint(driver), toPoint(origin)], isReal: false };
};

// Where "Navigate" takes the driver: the pickup point while going for the
// passenger, the destination with the passenger on board, or null otherwise
const navigationTarget = (trip) => {
  if (trip?.status === TRIP_STATUS.DRIVER_ARRIVING) return trip.origin;
  if (trip?.status === TRIP_STATUS.IN_PROGRESS) return trip.destination;
  return null;
};

/**
 * Google Maps directions link for the current step of the trip (opened with
 * Linking), or null if there is nowhere to navigate to.
 */
export const navigationUrl = (trip) => {
  const target = navigationTarget(trip);
  if (!Number.isFinite(target?.lat) || !Number.isFinite(target?.lng)) {
    return null;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`;
};
