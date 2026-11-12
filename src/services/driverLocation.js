// AI-assisted: see docs/AI_LOG.md #27
// Ubicación y disponibilidad del conductor en drivers/{uid} (sección 3 del
// enunciado). Solo se escriben location, locationUpdatedAt e isAvailable, nunca
// status: firestore.rules deja al conductor cambiar su documento mientras el
// status siga igual. Ninguna función lanza: un fallo de red solo se registra.
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { withTimeout } from "./withTimeout";

// Como máximo una escritura de ubicación cada 10 segundos
export const LOCATION_SAVE_INTERVAL_MS = 10_000;

// Sin conexión, updateDoc espera al servidor indefinidamente
const SAVE_TIMEOUT_MS = 5_000;

/**
 * Si ya pasó el intervalo desde la última ubicación guardada (en ms). Con
 * lastSavedMs en null todavía no se ha guardado ninguna: se guarda ya.
 */
export const shouldSaveLocation = (
  lastSavedMs,
  nowMs,
  intervalMs = LOCATION_SAVE_INTERVAL_MS,
) => lastSavedMs === null || nowMs - lastSavedMs >= intervalMs;

/**
 * Disponible para solicitudes nuevas: conectado (botón Disponible) y sin un
 * viaje en curso. Al terminar o cancelar el viaje vuelve a seguir al botón.
 */
export const isDriverAvailable = ({ isOnline, hasActiveTrip }) =>
  Boolean(isOnline) && !hasActiveTrip;

/**
 * Qué isAvailable guardar cuando cambia hasActiveTrip, sin esperar a la siguiente
 * ubicación: false al empezar un viaje y true al terminarlo o cancelarlo, solo si
 * sigue conectado. Devuelve null si no hay que escribir nada.
 */
export const availabilityOnTripChange = ({
  hadActiveTrip,
  hasActiveTrip,
  isOnline,
}) => {
  if (hadActiveTrip === hasActiveTrip || !isOnline) return null;
  return !hasActiveTrip;
};

/**
 * Campos que se guardan con cada ubicación: { lat, lng } (como origin y
 * destination de trips), la hora del servidor y si está disponible.
 */
export const locationFields = ({ latitude, longitude }, isAvailable = true) => ({
  location: { lat: latitude, lng: longitude },
  locationUpdatedAt: serverTimestamp(),
  isAvailable,
});

const updateCurrentDriver = async (fields) => {
  const uid = auth?.currentUser?.uid;
  if (!uid) return false;
  try {
    await withTimeout(updateDoc(doc(db, "drivers", uid), fields), SAVE_TIMEOUT_MS);
    return true;
  } catch (error) {
    // Sin documento (registro sin guardar) no hay nada que marcar
    if (error.code !== "not-found") {
      console.warn("No se pudo guardar la ubicación del conductor:", error);
    }
    return false;
  }
};

// coords es { latitude, longitude } de expo-location
export const saveDriverLocation = (coords, isAvailable = true) =>
  updateCurrentDriver(locationFields(coords, isAvailable));

// Al empezar o terminar un viaje, sin esperar a la siguiente ubicación
export const setDriverAvailability = (isAvailable) =>
  updateCurrentDriver({ isAvailable });

// Al desconectarse, salir de la pantalla o cerrar sesión (antes de cerrar la
// sesión de Firebase, porque después las reglas ya no dejan escribir). Firestore
// aplica las escrituras de un mismo cliente en orden, así que una ubicación que
// iba en camino no lo vuelve a marcar disponible.
export const markDriverUnavailable = () => setDriverAvailability(false);
