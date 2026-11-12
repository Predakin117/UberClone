// AI-assisted: see docs/AI_LOG.md #18, #21
// Colección trips (sección 6 del enunciado): un documento por viaje, en la raíz de
// Firestore. Estas funciones puras repiten lo que permiten firestore.rules para que
// la app no intente un cambio que la base de datos va a rechazar.
import { calculateFare } from "../config/pricing";

// Campos de la tabla de la sección 6, con los nombres exactos del enunciado (son el
// contrato con la API del pasajero). origin y destination son { lat, lng, address };
// los montos son pesos enteros y createdAt y completedAt son timestamps.
export const TRIP_FIELDS = [
  "driverId",
  "passengerId",
  "origin",
  "destination",
  "distanceKm",
  "durationMin",
  "category",
  "fare",
  "commission",
  "tip",
  "driverEarnings",
  "commissionRate",
  "paymentMethod",
  "paymentStatus",
  "paymentId",
  "status",
  "rating",
  "createdAt",
  "completedAt",
];

export const PAYMENT_METHODS = ["mercadopago", "stripe", "cash"];

// Estados de la sección 3 del enunciado. "rejected" aparece en la explicación de
// "accepted": la solicitud queda así si el conductor la rechaza o se vence el tiempo.
// Son el contrato con la API del pasajero: no cambiar sus nombres.
export const TRIP_STATUS = {
  REQUESTED: "requested",
  ACCEPTED: "accepted",
  DRIVER_ARRIVING: "driver_arriving",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PAID: "paid",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

// Cambios de estado que puede hacer el conductor. "paid" no está: solo lo escribe
// el backend con firebase-admin cuando la pasarela confirma el pago.
export const DRIVER_TRANSITIONS = {
  requested: ["accepted", "rejected"],
  accepted: ["driver_arriving", "cancelled"],
  driver_arriving: ["in_progress", "cancelled"],
  in_progress: ["completed"],
};

export const canDriverChangeStatus = (from, to) =>
  (DRIVER_TRANSITIONS[from] ?? []).includes(to);

// Estado del pago que muestra el resumen (sección 3): Efectivo, Aprobado,
// Rechazado o Pendiente. paymentStatus lo escribe solo el backend.
export const paymentStatusKey = (trip) => {
  // AI-assisted: see docs/AI_LOG.md #28
  // Cash already confirmed by the driver (the backend left the trip "paid")
  if (trip.paymentMethod === "cash" && trip.status === TRIP_STATUS.PAID) {
    return "summary.paymentStatus.cashReceived";
  }
  if (trip.paymentMethod === "cash") return "summary.paymentStatus.cash";
  if (trip.paymentStatus === "approved") return "summary.paymentStatus.approved";
  if (trip.paymentStatus === "rejected") return "summary.paymentStatus.rejected";
  return "summary.paymentStatus.pending";
};

// Viajes que el conductor tiene en curso: el inicio lo lleva a esa pantalla
export const ACTIVE_STATUSES = [
  TRIP_STATUS.ACCEPTED,
  TRIP_STATUS.DRIVER_ARRIVING,
  TRIP_STATUS.IN_PROGRESS,
];

// Códigos de error de los viajes, como claves "trip.error.<código>" de
// src/i18n/strings.js. Los primeros los devuelve validateDriverUpdate; los
// demás, tripRepository y la fuente de solicitudes.
export const TRIP_ERROR_CODES = [
  "invalidTransition",
  "alreadyTaken",
  "notApproved",
  "notYourTrip",
  "fieldNotAllowed",
  "invalidAmounts",
  "notFound",
  "noSession",
  "permissionDenied",
  "failed",
  "loadFailed",
];

// Timestamp de Firestore en milisegundos. Una solicitud recién creada puede
// llegar con createdAt en null mientras el servidor pone la hora: va al final.
const toMillis = (timestamp) =>
  timestamp?.toMillis?.() ?? Number.POSITIVE_INFINITY;

// La más antigua primero, por createdAt (la que debe ver el conductor)
export const sortOldestFirst = (trips) =>
  [...trips].sort((a, b) => {
    const first = toMillis(a.createdAt);
    const second = toMillis(b.createdAt);
    if (first === second) return 0;
    return first < second ? -1 : 1;
  });

// Campos que el conductor puede escribir en cada cambio. Los del pago
// (paymentStatus, paymentId) nunca están: son del backend.
const COMPLETION_FIELDS = [
  "status",
  "fare",
  "commission",
  "tip",
  "driverEarnings",
  "commissionRate",
  "completedAt",
];

export const driverWritableFields = (to) => {
  if (to === TRIP_STATUS.ACCEPTED || to === TRIP_STATUS.REJECTED) {
    return ["status", "driverId"];
  }
  if (to === TRIP_STATUS.COMPLETED) return COMPLETION_FIELDS;
  return ["status"];
};

// Montos que se revisan al completar: deben ser los de calculateFare
const AMOUNT_FIELDS = [
  "fare",
  "commission",
  "tip",
  "driverEarnings",
  "commissionRate",
];

/**
 * Revisa un cambio que el conductor uid quiere hacer en trip, igual que
 * firestore.rules. driverStatus es el status de drivers/{uid}: solo un conductor
 * "approved" puede aceptar o rechazar. Devuelve null si está permitido o el motivo
 * si no.
 */
export const validateDriverUpdate = (trip, changes, uid, driverStatus) => {
  const to = changes.status;
  if (!canDriverChangeStatus(trip.status, to)) return "invalidTransition";

  const isNewRequest = trip.status === TRIP_STATUS.REQUESTED;
  if (isNewRequest) {
    // Solo una solicitud sin conductor, y queda a nombre de quien la toma
    if (trip.driverId != null) return "alreadyTaken";
    if (driverStatus !== "approved") return "notApproved";
    if (changes.driverId !== uid) return "notYourTrip";
  } else if (trip.driverId !== uid) {
    return "notYourTrip";
  }

  const allowed = driverWritableFields(to);
  const extra = Object.keys(changes).filter((field) => !allowed.includes(field));
  if (extra.length > 0) return "fieldNotAllowed";

  // Al completar, los montos deben salir de calculateFare con los datos del viaje
  if (to === TRIP_STATUS.COMPLETED) {
    const expected = completionFields(trip, changes.tip ?? 0);
    const wrong = AMOUNT_FIELDS.some(
      (field) => changes[field] !== expected[field],
    );
    if (wrong || changes.tip < 0) return "invalidAmounts";
  }
  return null;
};

/**
 * Montos con los que se cierra el viaje, calculados con la misma función de la
 * estimación. completedAt lo agrega quien guarda, con la hora del servidor.
 */
export const completionFields = (trip, tip = 0) => {
  const { fare, commission, driverEarnings, commissionRate, tip: safeTip } =
    calculateFare({
      distanceKm: trip.distanceKm,
      durationMin: trip.durationMin,
      category: trip.category,
      tip,
    });
  return {
    status: TRIP_STATUS.COMPLETED,
    fare,
    commission,
    tip: safeTip,
    driverEarnings,
    commissionRate,
  };
};
