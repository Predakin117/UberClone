// AI-assisted: see docs/AI_LOG.md #26, #62
// Pagos del viaje (sección 4 del enunciado). El backend es el único que escribe
// paymentStatus y el estado "paid": las reglas de Firestore no se lo permiten a
// la app. auth y db son los de firebase-admin; las pruebas pasan unos simulados.
//
// Cada función devuelve { status, cuerpo } para responder por HTTP.

const PAGO_EN_EFECTIVO = { paymentStatus: "cash", status: "paid" };

const error = (status, codigoError, mensaje) => ({
  status,
  cuerpo: { ok: false, codigoError, error: mensaje },
});

// El token de Firebase Auth que la app manda en "Authorization: Bearer <token>"
function leerToken(cabecera) {
  const coincide = /^Bearer\s+(\S+)$/i.exec(cabecera ?? "");
  return coincide ? coincide[1] : null;
}

function crearPagos({ auth, db }) {
  // uid del conductor dueño del token, o null si el token no sirve
  async function verificarConductor(cabecera) {
    const token = leerToken(cabecera);
    if (!token) return null;
    try {
      const decodificado = await auth.verifyIdToken(token);
      return decodificado.uid;
    } catch {
      return null;
    }
  }

  /**
   * POST /pagos/efectivo { tripId }: el conductor confirma que recibió el
   * efectivo. Solo si el viaje está "completed", es suyo y su paymentMethod es
   * "cash", queda con paymentStatus "cash" y status "paid". Si ya estaba pagado
   * en efectivo, responde ok sin escribir (la app pudo reintentar tras perder
   * la conexión).
   */
  async function confirmarEfectivo(cabecera, body) {
    const uid = await verificarConductor(cabecera);
    if (!uid) {
      return error(401, "no_autorizado", "Falta el token del conductor o no es válido");
    }
    const tripId = body?.tripId;
    if (typeof tripId !== "string" || tripId.trim() === "" || tripId.includes("/")) {
      return error(400, "datos_invalidos", "tripId debe ser el id de un viaje");
    }

    const referencia = db.collection("trips").doc(tripId);
    // En una transacción: si dos peticiones llegan a la vez, solo una escribe
    return db.runTransaction(async (transaccion) => {
      const documento = await transaccion.get(referencia);
      if (!documento.exists) return error(404, "no_encontrado", "El viaje no existe");

      const viaje = documento.data();
      if (viaje.driverId !== uid) {
        return error(403, "no_es_tu_viaje", "El viaje es de otro conductor");
      }
      if (viaje.paymentMethod !== "cash") {
        return error(409, "metodo_invalido", "El viaje no se paga en efectivo");
      }
      if (viaje.status === "paid" && viaje.paymentStatus === "cash") {
        return { status: 200, cuerpo: { ok: true } };
      }
      if (viaje.status !== "completed") {
        return error(409, "estado_invalido", "El viaje todavía no está terminado");
      }

      transaccion.update(referencia, PAGO_EN_EFECTIVO);
      return { status: 200, cuerpo: { ok: true } };
    });
  }

  return { confirmarEfectivo, verificarConductor };
}

// AI-assisted: see docs/AI_LOG.md #62
// Mercado Pago status of a payment → paymentStatus of the trip. Statuses not
// listed here (refunded, charged_back) change nothing.
const MP_STATUS = {
  approved: "approved",
  pending: "pending",
  in_process: "pending",
  authorized: "pending",
  in_mediation: "pending",
  rejected: "rejected",
  cancelled: "rejected",
};

// What the passenger pays: the fare plus the tip, in integer pesos
const tripAmount = (trip) =>
  Math.round(Number(trip.fare) || 0) + Math.round(Number(trip.tip) || 0);

/**
 * Changes for the trip from a payment that was read from Mercado Pago (never
 * from the notification itself), or null if nothing changes. Only a
 * "mercadopago" trip that is "completed" changes. An approved payment must be
 * in COP and for the trip's amount; then the trip becomes "paid" (section 4:
 * paymentStatus, paymentId and status: paid).
 */
function paymentChanges(trip, payment) {
  if (trip.paymentMethod !== "mercadopago" || trip.status !== "completed") {
    return null;
  }
  const paymentStatus = MP_STATUS[payment?.status];
  if (!paymentStatus) return null;
  if (
    paymentStatus === "approved" &&
    (payment.currency_id !== "COP" ||
      Math.round(payment.transaction_amount) !== tripAmount(trip))
  ) {
    return null;
  }
  const changes = { paymentStatus, paymentId: String(payment.id) };
  if (paymentStatus === "approved") changes.status = "paid";
  if (
    trip.paymentStatus === changes.paymentStatus &&
    trip.paymentId === changes.paymentId
  ) {
    return null;
  }
  return changes;
}

// A trip id that Firestore accepts as a document id
const isTripId = (tripId) =>
  typeof tripId === "string" && tripId.trim() !== "" && !tripId.includes("/");

/**
 * Mercado Pago Checkout Pro (section 4). auth and db are the firebase-admin
 * ones; mercadoPago is createMercadoPago(...) of ./mercadoPago, or null when
 * MP_ACCESS_TOKEN is missing. Each function returns { status, cuerpo } (or
 * { status, html } for the return page) to answer over HTTP.
 */
function createMercadoPagoPayments({ auth, db, mercadoPago, logger = console }) {
  const { verificarConductor } = crearPagos({ auth, db });
  const tripRef = (tripId) => db.collection("trips").doc(tripId);

  // The driver's Mercado Pago trip, or the error to answer
  async function readDriverTrip(header, tripId) {
    const uid = await verificarConductor(header);
    if (!uid) {
      return { fail: error(401, "no_autorizado", "Missing or invalid driver token") };
    }
    if (!isTripId(tripId)) {
      return { fail: error(400, "datos_invalidos", "tripId must be a trip id") };
    }
    const trip = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tripRef(tripId));
      return snapshot.exists ? snapshot.data() : null;
    });
    if (!trip) return { fail: error(404, "no_encontrado", "The trip does not exist") };
    if (trip.driverId !== uid) {
      return { fail: error(403, "no_es_tu_viaje", "The trip belongs to another driver") };
    }
    if (trip.paymentMethod !== "mercadopago") {
      return { fail: error(409, "metodo_invalido", "The trip is not paid with Mercado Pago") };
    }
    return { trip };
  }

  /**
   * Saves a payment read from Mercado Pago on its trip (external_reference),
   * in a transaction. Returns the trip's paymentStatus afterwards, or null if
   * the trip does not exist.
   */
  async function applyPayment(payment) {
    const tripId = payment?.external_reference;
    if (!isTripId(tripId)) return null;
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tripRef(tripId));
      if (!snapshot.exists) return null;
      const trip = snapshot.data();
      const changes = paymentChanges(trip, payment);
      if (changes) transaction.update(tripRef(tripId), changes);
      return changes?.paymentStatus ?? trip.paymentStatus ?? "pending";
    });
  }

  const notConfigured = () =>
    error(503, "pagos_no_configurados", "Missing MP_ACCESS_TOKEN or serviceAccountKey.json");

  /**
   * POST /pagos/mercadopago { tripId, amount }: the app sends the trip and the
   * amount it calculated (fare + tip); the backend checks it against the trip
   * and creates the preference with the secret token. Answers { ok, url }.
   */
  async function startPayment(header, body) {
    if (!mercadoPago) return notConfigured();
    const { trip, fail } = await readDriverTrip(header, body?.tripId);
    if (fail) return fail;
    if (trip.status === "paid") {
      return error(409, "ya_pagado", "The trip is already paid");
    }
    if (trip.status !== "completed") {
      return error(409, "estado_invalido", "The trip has not finished yet");
    }
    const amount = tripAmount(trip);
    if (body?.amount !== amount || amount <= 0) {
      return error(409, "monto_invalido", "The amount does not match the trip");
    }
    try {
      const { url } = await mercadoPago.createPreference({
        tripId: body.tripId,
        amount,
        title: "Viaje UberClone",
      });
      return { status: 200, cuerpo: { ok: true, url } };
    } catch (mpError) {
      logger.error("Mercado Pago did not create the preference:", mpError.message);
      return error(502, "pasarela_no_disponible", "Mercado Pago did not answer");
    }
  }

  /**
   * POST /pagos/mercadopago/verificar { tripId }: when the checkout closes,
   * the app asks for the trip's payments in Mercado Pago (in case the webhook
   * did not arrive) and the newest one is saved, or an approved one if any.
   * Answers { ok, paymentStatus }.
   */
  async function checkPayment(header, body) {
    if (!mercadoPago) return notConfigured();
    const { trip, fail } = await readDriverTrip(header, body?.tripId);
    if (fail) return fail;
    try {
      const payments = await mercadoPago.findTripPayments(body.tripId);
      const payment =
        payments.find((item) => item.status === "approved") ?? payments[0];
      const paymentStatus = payment
        ? await applyPayment(payment)
        : (trip.paymentStatus ?? "pending");
      return { status: 200, cuerpo: { ok: true, paymentStatus } };
    } catch (mpError) {
      logger.error("Mercado Pago did not answer the search:", mpError.message);
      return error(502, "pasarela_no_disponible", "Mercado Pago did not answer");
    }
  }

  /**
   * POST /pagos/mercadopago/webhook: Mercado Pago tells that a payment
   * changed (type "payment" and data.id, in the body or the query). The
   * notification is only a hint: the payment is read again from Mercado Pago
   * with the token, so a fake notification cannot mark a trip as paid. An
   * error answers 500 so Mercado Pago tries again later.
   */
  async function webhook(query, body) {
    if (!mercadoPago) return notConfigured();
    const type = body?.type ?? query.type ?? query.topic;
    const paymentId = body?.data?.id ?? query["data.id"] ?? query.id;
    if (type !== "payment" || !paymentId) {
      return { status: 200, cuerpo: { ok: true } };
    }
    try {
      await applyPayment(await mercadoPago.getPayment(paymentId));
      return { status: 200, cuerpo: { ok: true } };
    } catch (mpError) {
      logger.error("Error with the Mercado Pago notification:", mpError.message);
      return error(500, "fallo", "The payment could not be read");
    }
  }

  /**
   * GET /pagos/mercadopago/retorno?payment_id=…: page where Mercado Pago
   * leaves the passenger after paying. It saves the payment too and asks to
   * go back to the app, where the summary already shows the result.
   */
  async function returnPage(query) {
    let paymentStatus = null;
    if (mercadoPago && query.payment_id && query.payment_id !== "null") {
      try {
        paymentStatus = await applyPayment(
          await mercadoPago.getPayment(query.payment_id),
        );
      } catch (mpError) {
        logger.error("Error reading the returned payment:", mpError.message);
      }
    }
    return { status: 200, html: returnHtml(paymentStatus) };
  }

  return { startPayment, checkPayment, webhook, returnPage };
}

// Page shown in the browser after the checkout (the passenger reads it)
const RETURN_TEXT = {
  approved: ["Pago aprobado", "El conductor ya ve el pago en su app."],
  rejected: ["Pago rechazado", "Vuelve a la app para intentarlo de nuevo."],
  pending: ["Pago pendiente", "Mercado Pago todavía está procesando el pago."],
};

function returnHtml(paymentStatus) {
  const [title, text] = RETURN_TEXT[paymentStatus] ?? [
    "Pago terminado",
    "Vuelve a la app para ver el resultado.",
  ];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px 24px">
<h1>${title}</h1><p>${text}</p>
<p><strong>Ya puedes cerrar esta ventana y volver a la app.</strong></p>
</body></html>`;
}

module.exports = {
  crearPagos,
  leerToken,
  createMercadoPagoPayments,
  paymentChanges,
  tripAmount,
};
