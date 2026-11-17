// AI-assisted: see docs/AI_LOG.md #26, #62, #63
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
 *
 * AI-assisted: see docs/AI_LOG.md #63
 * split is true when the payment was read with the driver's own token (split
 * payment): the approved trip also gets paymentSplit: true, so the earnings
 * know the driver already received their part and the platform owes nothing.
 */
function paymentChanges(trip, payment, { split = false } = {}) {
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
  if (paymentStatus === "approved") {
    changes.status = "paid";
    if (split) changes.paymentSplit = true;
  }
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

// A link that opens the driver app: exp:// in Expo Go, uberclonedriver:// in
// a build (app.json "scheme"). Only those, so the return page can't be used
// to send people to any website; no quotes or spaces, so it is safe in HTML.
const isAppUrl = (url) =>
  typeof url === "string" &&
  url.length <= 300 &&
  /^(exp|exps|uberclonedriver):\/\/[^\s"'<>\\]*$/.test(url);

// Newest payment first (date_created is an ISO date)
const byNewest = (a, b) =>
  String(b.payment.date_created ?? "").localeCompare(
    String(a.payment.date_created ?? ""),
  );

/**
 * Mercado Pago Checkout Pro (section 4). auth and db are the firebase-admin
 * ones; mercadoPago is createMercadoPago(...) of ./mercadoPago with the
 * platform's token, or null when MP_ACCESS_TOKEN is missing. Each function
 * returns { status, cuerpo } (or { status, html } for the pages shown in the
 * browser) to answer over HTTP.
 *
 * AI-assisted: see docs/AI_LOG.md #63
 * Split payments (optional bonus): sellers is createSellerAccounts(...) of
 * ./sellerAccounts and clientFor(token) creates a Mercado Pago client with a
 * driver's token. Both are null without MP_CLIENT_ID and MP_CLIENT_SECRET;
 * then every trip is charged by the platform, as before.
 */
function createMercadoPagoPayments({
  auth,
  db,
  mercadoPago,
  sellers = null,
  clientFor = null,
  logger = console,
}) {
  const { verificarConductor } = crearPagos({ auth, db });
  const tripRef = (tripId) => db.collection("trips").doc(tripId);

  const readTrip = (tripId) =>
    db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tripRef(tripId));
      return snapshot.exists ? snapshot.data() : null;
    });

  // Mercado Pago client with the driver's linked account, or null
  async function sellerClient(uid) {
    if (!sellers || !clientFor || !uid) return null;
    const token = await sellers.accessTokenFor(uid);
    return token ? clientFor(token) : null;
  }

  const unauthorized = () =>
    error(401, "no_autorizado", "Missing or invalid driver token");

  // The driver's Mercado Pago trip, or the error to answer
  async function readDriverTrip(header, tripId) {
    const uid = await verificarConductor(header);
    if (!uid) return { fail: unauthorized() };
    if (!isTripId(tripId)) {
      return { fail: error(400, "datos_invalidos", "tripId must be a trip id") };
    }
    const trip = await readTrip(tripId);
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
   * in a transaction. driverUid is set when the payment was read with that
   * driver's token (split payment): it only counts for that driver's trip.
   * Returns the trip's paymentStatus afterwards, or null if the trip does
   * not exist.
   */
  async function applyPayment(payment, driverUid = null) {
    const tripId = payment?.external_reference;
    if (!isTripId(tripId)) return null;
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tripRef(tripId));
      if (!snapshot.exists) return null;
      const trip = snapshot.data();
      if (driverUid && trip.driverId !== driverUid) {
        return trip.paymentStatus ?? "pending";
      }
      const changes = paymentChanges(trip, payment, { split: Boolean(driverUid) });
      if (changes) transaction.update(tripRef(tripId), changes);
      return changes?.paymentStatus ?? trip.paymentStatus ?? "pending";
    });
  }

  /**
   * Reads one payment: first with the driver's token (split payments are in
   * the driver's account), then with the platform's. Returns
   * { payment, driverUid }; driverUid is null when the platform read it.
   */
  async function readPayment(paymentId, driverUid) {
    const seller = await sellerClient(driverUid);
    if (seller) {
      try {
        return { payment: await seller.getPayment(paymentId), driverUid };
      } catch {
        // Not in the driver's account: it was charged by the platform
      }
    }
    return { payment: await mercadoPago.getPayment(paymentId), driverUid: null };
  }

  const notConfigured = () =>
    error(503, "pagos_no_configurados", "Missing MP_ACCESS_TOKEN or serviceAccountKey.json");

  /**
   * POST /pagos/mercadopago { tripId, amount }: the app sends the trip and the
   * amount it calculated (fare + tip); the backend checks it against the trip
   * and creates the preference. If the driver linked their Mercado Pago
   * account, the preference is created with the driver's token and the
   * platform's commission as marketplace_fee (split payment); if not, with
   * the platform's token. Answers { ok, url, split }.
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
      const preference = {
        tripId: body.tripId,
        amount,
        title: "Viaje UberClone",
        // After paying, the return page sends the passenger back to the app
        ...(isAppUrl(body.returnUrl) ? { appReturnUrl: body.returnUrl } : {}),
      };
      const seller = await sellerClient(trip.driverId);
      const commission = Math.round(Number(trip.commission) || 0);
      const split = Boolean(seller) && commission > 0 && commission < amount;
      const { url } = split
        ? await seller.createPreference({
            ...preference,
            marketplaceFee: commission,
            notificationParams: { driver: trip.driverId },
          })
        : await mercadoPago.createPreference(preference);
      return { status: 200, cuerpo: { ok: true, url, split } };
    } catch (mpError) {
      logger.error("Mercado Pago did not create the preference:", mpError.message);
      return error(502, "pasarela_no_disponible", "Mercado Pago did not answer");
    }
  }

  /**
   * POST /pagos/mercadopago/verificar { tripId }: when the checkout closes,
   * the app asks for the trip's payments in Mercado Pago (in case the webhook
   * did not arrive), in the driver's account and in the platform's. An
   * approved one is saved if there is one; if not, the newest.
   * Answers { ok, paymentStatus }.
   */
  async function checkPayment(header, body) {
    if (!mercadoPago) return notConfigured();
    const { trip, fail } = await readDriverTrip(header, body?.tripId);
    if (fail) return fail;
    try {
      const found = [];
      const seller = await sellerClient(trip.driverId);
      if (seller) {
        for (const payment of await seller.findTripPayments(body.tripId)) {
          found.push({ payment, driverUid: trip.driverId });
        }
      }
      const sellerIds = new Set(found.map((item) => String(item.payment.id)));
      for (const payment of await mercadoPago.findTripPayments(body.tripId)) {
        if (!sellerIds.has(String(payment.id))) {
          found.push({ payment, driverUid: null });
        }
      }
      found.sort(byNewest);
      const chosen =
        found.find((item) => item.payment.status === "approved") ?? found[0];
      const paymentStatus = chosen
        ? await applyPayment(chosen.payment, chosen.driverUid)
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
   * with the token, so a fake notification cannot mark a trip as paid. A
   * split payment brings ?driver=<uid> (set in the preference) to read it
   * with that driver's token. An error answers 500 so Mercado Pago tries
   * again later.
   */
  async function webhook(query, body) {
    if (!mercadoPago) return notConfigured();
    const type = body?.type ?? query.type ?? query.topic;
    const paymentId = body?.data?.id ?? query["data.id"] ?? query.id;
    if (type !== "payment" || !paymentId) {
      return { status: 200, cuerpo: { ok: true } };
    }
    try {
      const { payment, driverUid } = await readPayment(paymentId, query.driver);
      await applyPayment(payment, driverUid);
      return { status: 200, cuerpo: { ok: true } };
    } catch (mpError) {
      logger.error("Error with the Mercado Pago notification:", mpError.message);
      return error(500, "fallo", "The payment could not be read");
    }
  }

  /**
   * GET /pagos/mercadopago/retorno?payment_id=…&external_reference=…: page
   * where Mercado Pago leaves the passenger after paying. It saves the
   * payment too and asks to go back to the app, where the summary already
   * shows the result. With ?app=<app link> (set when the checkout was
   * created), the page opens the app by itself, so the passenger doesn't
   * have to close the browser.
   */
  async function returnPage(query) {
    let paymentStatus = null;
    if (mercadoPago && query.payment_id && query.payment_id !== "null") {
      try {
        const trip = isTripId(query.external_reference)
          ? await readTrip(query.external_reference)
          : null;
        const { payment, driverUid } = await readPayment(
          query.payment_id,
          trip?.driverId,
        );
        paymentStatus = await applyPayment(payment, driverUid);
      } catch (mpError) {
        logger.error("Error reading the returned payment:", mpError.message);
      }
    }
    const [title, text] = RETURN_TEXT[paymentStatus] ?? RETURN_DEFAULT;
    if (isAppUrl(query.app)) {
      const separator = query.app.includes("?") ? "&" : "?";
      const appUrl = `${query.app}${separator}status=${encodeURIComponent(paymentStatus ?? "unknown")}`;
      return { status: 200, html: pageHtml(title, text, appUrl) };
    }
    return { status: 200, html: pageHtml(title, text) };
  }

  /**
   * POST /pagos/mercadopago/vinculo, with the driver's token: whether split
   * payments are available on this backend and whether the driver linked an
   * account. Answers { ok, available, linked }.
   */
  async function linkStatus(header) {
    const uid = await verificarConductor(header);
    if (!uid) return unauthorized();
    if (!sellers) {
      return { status: 200, cuerpo: { ok: true, available: false, linked: false } };
    }
    const { linked } = await sellers.status(uid);
    return { status: 200, cuerpo: { ok: true, available: true, linked } };
  }

  /**
   * POST /pagos/mercadopago/vincular, with the driver's token: the Mercado
   * Pago page where the driver authorizes the platform. Answers { ok, url }.
   */
  async function startLink(header) {
    const uid = await verificarConductor(header);
    if (!uid) return unauthorized();
    if (!sellers) {
      return error(503, "vinculo_no_configurado", "Missing MP_CLIENT_ID or MP_CLIENT_SECRET");
    }
    return { status: 200, cuerpo: { ok: true, url: sellers.startLink(uid) } };
  }

  /** POST /pagos/mercadopago/desvincular, with the driver's token. */
  async function unlink(header) {
    const uid = await verificarConductor(header);
    if (!uid) return unauthorized();
    if (sellers) await sellers.unlink(uid);
    return { status: 200, cuerpo: { ok: true } };
  }

  /**
   * GET /pagos/mercadopago/oauth?code=…&state=…: Mercado Pago comes back here
   * after the driver authorizes (or refuses). The code is changed for the
   * driver's tokens and the page asks to go back to the app.
   */
  async function oauthReturn(query) {
    if (!sellers || query.error || !query.code) {
      return { status: 200, html: pageHtml(...LINK_TEXT.failed) };
    }
    try {
      const uid = await sellers.finishLink(query.state, query.code);
      return {
        status: 200,
        html: pageHtml(...(uid ? LINK_TEXT.linked : LINK_TEXT.expired)),
      };
    } catch (oauthError) {
      logger.error("Mercado Pago did not link the account:", oauthError.message);
      return { status: 200, html: pageHtml(...LINK_TEXT.failed) };
    }
  }

  return {
    startPayment,
    checkPayment,
    webhook,
    returnPage,
    linkStatus,
    startLink,
    unlink,
    oauthReturn,
  };
}

// Pages shown in the browser (the passenger after paying, the driver after
// linking the account)
const RETURN_TEXT = {
  approved: ["Pago aprobado", "El conductor ya ve el pago en su app."],
  rejected: ["Pago rechazado", "Vuelve a la app para intentarlo de nuevo."],
  pending: ["Pago pendiente", "Mercado Pago todavía está procesando el pago."],
};
const RETURN_DEFAULT = ["Pago terminado", "Vuelve a la app para ver el resultado."];

const LINK_TEXT = {
  linked: [
    "Cuenta vinculada",
    "Tu parte de los viajes con Mercado Pago llegará directo a tu cuenta.",
  ],
  expired: [
    "El enlace venció",
    "Vuelve a la app y toca otra vez Vincular Mercado Pago.",
  ],
  failed: [
    "No se vinculó la cuenta",
    "Vuelve a la app para intentarlo de nuevo.",
  ],
};

// appUrl (already checked with isAppUrl): the page opens the app right away,
// and shows a "Volver a la app" button in case the phone asks first
function pageHtml(title, text, appUrl) {
  const href = appUrl ? appUrl.replace(/&/g, "&amp;") : null;
  const back = href
    ? `<meta http-equiv="refresh" content="0;url=${href}">`
    : "";
  const action = href
    ? `<p><a href="${href}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#000;color:#fff;text-decoration:none;font-weight:700">Volver a la app</a></p>`
    : "<p><strong>Ya puedes cerrar esta ventana y volver a la app.</strong></p>";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${back}
<title>${title}</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px 24px">
<h1>${title}</h1><p>${text}</p>
${action}
</body></html>`;
}

module.exports = {
  crearPagos,
  leerToken,
  createMercadoPagoPayments,
  paymentChanges,
  tripAmount,
};
