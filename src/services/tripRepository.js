// AI-assisted: see docs/AI_LOG.md #21
// Cambios del conductor en sus viajes (colección trips). Antes de escribir se
// revisa con validateDriverUpdate lo mismo que exigen firestore.rules, para
// mostrar un error claro en vez de un "permiso denegado".
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import {
  ACTIVE_STATUSES,
  PASSENGER_RATING_FIELD,
  TRIP_STATUS,
  completionFields,
  validateDriverUpdate,
  validatePassengerRating,
} from "./trips";

// code es una clave de src/i18n/strings.js ("trip.error.<código>")
export class TripError extends Error {
  constructor(problem, cause) {
    super(problem);
    this.code = `trip.error.${problem}`;
    this.cause = cause;
  }
}

const toTripError = (error) => {
  if (error instanceof TripError) return error;
  const problem =
    error?.code === "permission-denied" ? "permissionDenied" : "failed";
  return new TripError(problem, error);
};

const currentUid = () => {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new TripError("noSession");
  return uid;
};

const checkUpdate = (trip, changes, uid, driverStatus) => {
  const problem = validateDriverUpdate(trip, changes, uid, driverStatus);
  if (problem) throw new TripError(problem);
};

/**
 * Acepta ("accepted") o rechaza ("rejected") una solicitud sin conductor. Va en
 * una transacción: si otro conductor la tomó un instante antes, falla sin pisarla.
 */
export const respondToRequest = async (tripId, status, driverStatus) => {
  try {
    const uid = currentUid();
    const tripRef = doc(db, "trips", tripId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(tripRef);
      if (!snapshot.exists()) throw new TripError("notFound");
      const changes = { status, driverId: uid };
      checkUpdate(snapshot.data(), changes, uid, driverStatus);
      transaction.update(tripRef, changes);
    });
  } catch (error) {
    throw toTripError(error);
  }
};

// Avanza el viaje del conductor: driver_arriving, in_progress o cancelled
export const advanceTrip = async (trip, status) => {
  try {
    const uid = currentUid();
    const changes = { status };
    checkUpdate(trip, changes, uid);
    await updateDoc(doc(db, "trips", trip.id), changes);
  } catch (error) {
    throw toTripError(error);
  }
};

// Cierra el viaje con los montos de calculateFare y la hora del servidor
export const completeTrip = async (trip, tip = 0) => {
  try {
    const uid = currentUid();
    const changes = {
      ...completionFields(trip, tip),
      completedAt: serverTimestamp(),
    };
    checkUpdate(trip, changes, uid);
    await updateDoc(doc(db, "trips", trip.id), changes);
  } catch (error) {
    throw toTripError(error);
  }
};

/**
 * Escucha el viaje en curso del conductor (accepted, driver_arriving o
 * in_progress). onTrip recibe el viaje o null. Devuelve la función que deja de
 * escuchar, para la limpieza del useEffect.
 */
export const subscribeToActiveTrip = (uid, onTrip, onError) => {
  // Mismos filtros que firestore.rules: solo los viajes con driverId == uid
  const activeTrips = query(
    collection(db, "trips"),
    where("driverId", "==", uid),
    where("status", "in", ACTIVE_STATUSES),
  );
  return onSnapshot(
    activeTrips,
    (snapshot) => {
      const tripDoc = snapshot.docs[0];
      onTrip(tripDoc ? { id: tripDoc.id, ...tripDoc.data() } : null);
    },
    onError,
  );
};

// AI-assisted: see docs/AI_LOG.md #28
// Finished trips shown in the history and the earnings
export const HISTORY_STATUSES = [TRIP_STATUS.COMPLETED, TRIP_STATUS.PAID];
export const HISTORY_LIMIT = 20;

// A trip completed a moment ago has completedAt = null in the local snapshot
// until the server answers: "estimate" gives the phone's time meanwhile.
const tripFromDoc = (tripDoc) => ({
  id: tripDoc.id,
  ...tripDoc.data({ serverTimestamps: "estimate" }),
});

/**
 * Listens to the last HISTORY_LIMIT finished trips of the driver (completed or
 * paid), newest first by completedAt. onTrips receives the list. Needs the
 * composite index driverId ↑, status ↑, completedAt ↓ (see docs/APIS.md).
 * Returns the unsubscribe function for the useEffect cleanup.
 */
export const subscribeToTripHistory = (uid, onTrips, onError) => {
  const finishedTrips = query(
    collection(db, "trips"),
    where("driverId", "==", uid),
    where("status", "in", HISTORY_STATUSES),
    orderBy("completedAt", "desc"),
    limit(HISTORY_LIMIT),
  );
  return onSnapshot(
    finishedTrips,
    (snapshot) => onTrips(snapshot.docs.map(tripFromDoc)),
    onError,
  );
};

/**
 * Listens to all the finished trips of the driver (completed or paid) with
 * completedAt since sinceMillis, newest first, without a limit: the earnings
 * need every trip of the period. Uses the same composite index as the history.
 */
export const subscribeToTripsSince = (uid, sinceMillis, onTrips, onError) => {
  const finishedTrips = query(
    collection(db, "trips"),
    where("driverId", "==", uid),
    where("status", "in", HISTORY_STATUSES),
    where("completedAt", ">=", Timestamp.fromMillis(sinceMillis)),
    orderBy("completedAt", "desc"),
  );
  return onSnapshot(
    finishedTrips,
    (snapshot) => onTrips(snapshot.docs.map(tripFromDoc)),
    onError,
  );
};

/**
 * Listens to one trip by id (for example, to see its payment status change).
 * onTrip receives the trip, or null if it does not exist.
 */
export const subscribeToTrip = (tripId, onTrip, onError) =>
  onSnapshot(
    doc(db, "trips", tripId),
    (tripDoc) => onTrip(tripDoc.exists() ? tripFromDoc(tripDoc) : null),
    onError,
  );

// AI-assisted: see docs/AI_LOG.md #31
/**
 * Saves the driver's rating of the passenger (1 to 5) in passengerRating,
 * once, after the trip ends. Checked first with validatePassengerRating, the
 * same as firestore.rules. Throws a TripError.
 */
export const ratePassenger = async (trip, rating) => {
  try {
    const uid = currentUid();
    const problem = validatePassengerRating(trip, rating, uid);
    if (problem) throw new TripError(problem);
    await updateDoc(doc(db, "trips", trip.id), {
      [PASSENGER_RATING_FIELD]: rating,
    });
  } catch (error) {
    throw toTripError(error);
  }
};
