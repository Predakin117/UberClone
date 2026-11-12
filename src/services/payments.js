// AI-assisted: see docs/AI_LOG.md #23
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
// CONTRATO TEMPORAL: todavía no están implementadas y devuelven
// { ok: false, codigoError: "no_implementado" }.

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
  "estado_invalido", // el viaje no está "completed" (o ya está pagado)
  "metodo_invalido", // el paymentMethod del viaje no corresponde
  "fallo", // cualquier otro error
];

const NO_IMPLEMENTADO = { ok: false, codigoError: "no_implementado" };

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
export const markCashReceived = async (tripId) => NO_IMPLEMENTADO;
