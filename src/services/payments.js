// AI-assisted: see docs/AI_LOG.md #23, #26, #62
// Trip payments (section 4 of the assignment). It is the only module of the
// app that talks to the payments backend: the screens only call these
// functions. The app never writes paymentStatus, paymentId or the "paid"
// status; the backend does it with firebase-admin (docs/APIS.md).
//
// No function throws, like routesApi.js: they always return
// { ok: true, ... } or { ok: false, codigoError }.
//
// Use in the screens:
//   const res = await startMercadoPagoPayment(trip); // res.ok → open res.url
//   const res = await checkMercadoPagoPayment(trip.id); // after the checkout
//   const res = await markCashReceived(trip.id);       // res.ok → the trip is "paid"
import { env } from "../config/env";
import { auth } from "../config/firebase";

const TIMEOUT_MS = 15_000;

// Error codes these functions can return. To show them, each one has a key
// "payment.error.<code>" in src/i18n/strings.js.
export const PAYMENT_ERROR_CODES = [
  "sin_backend", // EXPO_PUBLIC_BACKEND_API_URL is missing in the .env
  "sin_conexion", // the backend could not be reached
  "sin_sesion", // no driver is logged in
  "no_autorizado", // the backend rejected the driver's token
  "no_encontrado", // the trip does not exist
  "no_es_tu_viaje", // the trip belongs to another driver
  "estado_invalido", // the trip is not "completed" yet
  "metodo_invalido", // the trip's paymentMethod does not match
  "monto_invalido", // the amount does not match the trip (Mercado Pago)
  "ya_pagado", // the trip is already paid (Mercado Pago)
  "pasarela_no_disponible", // Mercado Pago did not answer
  "pagos_no_configurados", // the backend has no Mercado Pago or firebase-admin
  "fallo", // any other error
];

// A code the app doesn't know is shown as "fallo"
const knownCode = (code) =>
  PAYMENT_ERROR_CODES.includes(code) ? code : "fallo";

// POST to the backend with the driver's Firebase token. Never throws.
const postWithSession = async (path, body) => {
  if (!env.backendApiUrl) return { ok: false, codigoError: "sin_backend" };
  const user = auth?.currentUser;
  if (!user) return { ok: false, codigoError: "sin_sesion" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const token = await user.getIdToken();
    const response = await fetch(`${env.backendApiUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) return data;
    return { ok: false, codigoError: knownCode(data.codigoError) };
  } catch {
    // No network, timeout or the token could not be renewed
    return { ok: false, codigoError: "sin_conexion" };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * What the passenger pays: the final fare plus the tip (integer pesos). Both
 * were saved when the trip was completed, with calculateFare.
 */
export const tripChargeAmount = (trip) =>
  Math.round(Number(trip?.fare) || 0) + Math.round(Number(trip?.tip) || 0);

/**
 * Creates the Mercado Pago payment of a trip ("completed", paymentMethod
 * "mercadopago"). Section 4: the app sends the tripId and the amount; the
 * backend checks the amount and creates the preference with the secret token.
 * Returns { ok: true, url } with the Checkout Pro link the app opens in the
 * browser, or { ok: false, codigoError }.
 */
export const startMercadoPagoPayment = async (trip) => {
  const result = await postWithSession("/pagos/mercadopago", {
    tripId: trip.id,
    amount: tripChargeAmount(trip),
  });
  return result.ok ? { ok: true, url: result.url } : result;
};

/**
 * Asks the backend to look for the trip's payment in Mercado Pago, for when
 * the checkout closes (in case the webhook didn't arrive). The backend saves
 * it on the trip, and the summary sees it in real time. Returns
 * { ok: true, paymentStatus } or { ok: false, codigoError }.
 */
export const checkMercadoPagoPayment = async (tripId) => {
  const result = await postWithSession("/pagos/mercadopago/verificar", {
    tripId,
  });
  return result.ok ? { ok: true, paymentStatus: result.paymentStatus } : result;
};

/**
 * Confirms the driver received the cash of the trip tripId ("completed",
 * paymentMethod "cash"). The backend leaves it "paid".
 * Returns { ok: true } or { ok: false, codigoError }.
 */
export const markCashReceived = async (tripId) => {
  const result = await postWithSession("/pagos/efectivo", { tripId });
  return result.ok ? { ok: true } : result;
};
