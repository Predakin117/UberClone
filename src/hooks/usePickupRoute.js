// AI-assisted: see docs/AI_LOG.md #21
// Ruta del conductor hasta el punto de recogida (sección 3: "ruta hacia el punto
// de recogida"). Se pide una sola vez por viaje, al aceptarlo o al reabrir la app
// con el viaje en accepted o driver_arriving, y vive en memoria (TripContext),
// no en Firestore. Si no hay ruta, se dibuja una línea recta.
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { fetchRoute } from "../services/routesApi";
import { pickupRoute } from "../services/tripRoute";
import { TRIP_STATUS } from "../services/trips";

const GOING_TO_PICKUP = [TRIP_STATUS.ACCEPTED, TRIP_STATUS.DRIVER_ARRIVING];

// Una ubicación de hace menos de 2 minutos sirve; si no hay, se pide la actual
const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

// Ubicación del conductor como { lat, lng }, o null sin permiso o sin señal
const driverLocation = async () => {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Location.requestForegroundPermissionsAsync());
    }
    if (status !== "granted") return null;

    const position =
      (await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
      })) ??
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }));
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (error) {
    console.error("Error leyendo la ubicación para la ruta:", error);
    return null;
  }
};

/**
 * Devuelve { coordinates, isReal } para el viaje que va hacia el pasajero, o null
 * mientras se calcula o si el viaje ya no va hacia el pasajero. Sin la ubicación
 * del conductor, coordinates queda vacío.
 */
export const usePickupRoute = (trip) => {
  const [route, setRoute] = useState(null);
  const requestedTripId = useRef(null);

  const tripId = trip?.id ?? null;
  const goingToPickup = GOING_TO_PICKUP.includes(trip?.status);
  const originLat = trip?.origin?.lat;
  const originLng = trip?.origin?.lng;

  useEffect(() => {
    if (!tripId || !goingToPickup) return;
    // Una sola vez por viaje: no en cada actualización de ubicación (sección 7)
    if (requestedTripId.current === tripId) return;
    requestedTripId.current = tripId;

    let cancelled = false;
    const load = async () => {
      const driver = await driverLocation();
      if (cancelled) return;
      // Sin la ubicación del conductor no hay desde dónde trazar la ruta
      if (!driver) {
        setRoute({ tripId, coordinates: [], isReal: false });
        return;
      }
      const origin = { lat: originLat, lng: originLng };
      const result = await fetchRoute(driver, origin);
      if (!cancelled) setRoute({ tripId, ...pickupRoute(driver, origin, result) });
    };
    load();

    // Limpieza: si el viaje cambia antes de que llegue la ruta, se descarta
    return () => {
      cancelled = true;
    };
  }, [tripId, goingToPickup, originLat, originLng]);

  return goingToPickup && route?.tripId === tripId ? route : null;
};
