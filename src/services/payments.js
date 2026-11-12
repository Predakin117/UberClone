// AI-assisted: see docs/AI_LOG.md #23, #26
// Pagos del viaje (sección 4 del enunciado). Es el único módulo de la app que
// habla con el backend de pagos: las pantallas solo llaman a estas funciones.
// La app nunca escribe paymentStatus, paymentId ni el estado "paid"; eso lo hace
// el backend con firebase-admin (docs/APIS.md).
//
// Ninguna función lanza errores, igual que routesApi.js: siempre devuelven
// { ok: true, ... } o { ok: false, codigoError }.
//
// Uso en las pantallas:
//   const res = await startMercadoPagoPayment(trip.id); // res.ok → abrir res.url
//   const res = await markCashReceived(trip.id);        // res.ok → el viaje pasa a "paid"
//
// markCashReceived ya llama al backend (POST /pagos/efectivo).
// startMercadoPagoPayment todavía no está implementada y devuelve
// { ok: false, codigoError: "no_implementado" }.
import { env } from "../config/env";
import { auth } from "../config/firebase";

const TIEMPO_LIMITE_MS = 15_000;

// Códigos de error que pueden devolver estas funciones. Para mostrarlos, cada uno
// se traduce con una clave "payment.error.<código>" en src/i18n/strings.js.
export const PAYMENT_ERROR_CODES = [
  "no_implementado", // la función todavía no existe en el backend
  "sin_backend", // falta EXPO_PUBLIC_BACKEND_API_URL en el .env
  "sin_conexion", // no se pudo llegar al backend
  "sin_sesion", // no hay conductor con sesión iniciada
  "no_autorizado", // el backend rechazó el token del conductor
  "no_encontrado", // el viaje no existe
  "no_es_tu_viaje", // el viaje es de otro conductor
  "estado_invalido", // el viaje todavía no está "completed"
  "metodo_invalido", // el paymentMethod del viaje no corresponde
  "fallo", // cualquier otro error
];

const NO_IMPLEMENTADO = { ok: false, codigoError: "no_implementado" };

// Un código que la app no conoce se muestra como "fallo"
const codigoConocido = (codigo) =>
  PAYMENT_ERROR_CODES.includes(codigo) ? codigo : "fallo";

// POST al backend con el token de Firebase del conductor. Nunca lanza.
const llamarConSesion = async (ruta, body) => {
  if (!env.backendApiUrl) return { ok: false, codigoError: "sin_backend" };
  const usuario = auth?.currentUser;
  if (!usuario) return { ok: false, codigoError: "sin_sesion" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIEMPO_LIMITE_MS);
  try {
    const token = await usuario.getIdToken();
    const response = await fetch(`${env.backendApiUrl}${ruta}`, {
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
    return { ok: false, codigoError: codigoConocido(data.codigoError) };
  } catch {
    // Sin red, tiempo agotado o no se pudo renovar el token
    return { ok: false, codigoError: "sin_conexion" };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Crea el pago de Mercado Pago del viaje tripId (que debe estar "completed" y
 * con paymentMethod "mercadopago").
 * Devuelve { ok: true, url } con el enlace de Checkout Pro que la app abre en el
 * navegador, o { ok: false, codigoError }.
 */
export const startMercadoPagoPayment = async (tripId) => NO_IMPLEMENTADO;

/**
 * Confirma que el conductor recibió el efectivo del viaje tripId (que debe estar
 * "completed" y con paymentMethod "cash"). El backend lo deja en "paid".
 * Devuelve { ok: true } o { ok: false, codigoError }.
 */
export const markCashReceived = async (tripId) => {
  const result = await llamarConSesion("/pagos/efectivo", { tripId });
  return result.ok ? { ok: true } : result;
};
