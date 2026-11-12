// AI-assisted: see docs/AI_LOG.md #21
// Coordenadas para dibujar la ruta del viaje en react-native-maps
// (docs/APIS.md, servicio 2). routePolyline viene de OpenRouteService; si falló
// y quedó en null, se dibuja una línea recta entre el origen y el destino.
import polyline from "@mapbox/polyline";

const toPoint = ({ lat, lng }) => ({ latitude: lat, longitude: lng });

// decode devuelve pares [lat, lng]; el mapa usa { latitude, longitude }
export const routeCoordinates = (trip) => {
  const straightLine = [toPoint(trip.origin), toPoint(trip.destination)];
  if (!trip.routePolyline) return straightLine;

  try {
    const points = polyline
      .decode(trip.routePolyline)
      .map(([latitude, longitude]) => ({ latitude, longitude }));
    return points.length >= 2 ? points : straightLine;
  } catch {
    return straightLine;
  }
};

// true si la ruta es la de OpenRouteService y no la línea recta de respaldo
export const hasRealRoute = (trip) => Boolean(trip.routePolyline);
