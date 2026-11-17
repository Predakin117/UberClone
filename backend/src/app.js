// AI-assisted: see docs/AI_LOG.md #11, #21, #26, #62, #63
// Servidor HTTP con el módulo nativo de Node (sin Express).
// Rutas (bajo /api/v1):
//   GET  /health
//   POST /auth/enviar-codigo     { email, nombre?, motivo: "registro" | "login", dispositivo? }
//   POST /auth/verificar-codigo  { email, codigo }
//   POST /rutas                  { origen: { lat, lng }, destino: { lat, lng } }
//   POST /pagos/efectivo         { tripId }  con "Authorization: Bearer <token de Firebase>"
//   POST /pagos/mercadopago            { tripId, amount }  with the driver's token
//   POST /pagos/mercadopago/verificar  { tripId }          with the driver's token
//   POST /pagos/mercadopago/webhook    notification from Mercado Pago (no token)
//   GET  /pagos/mercadopago/retorno    page after the checkout (no token)
// Split payments (driver's own Mercado Pago account):
//   POST /pagos/mercadopago/vinculo      {}  with the driver's token
//   POST /pagos/mercadopago/vincular     {}  with the driver's token
//   POST /pagos/mercadopago/desvincular  {}  with the driver's token
//   GET  /pagos/mercadopago/oauth        Mercado Pago comes back after linking
const http = require("node:http");
const { renderCorreo } = require("./mailer");
const { calcularRuta: calcularRutaOrs } = require("./rutas");

// { lat, lng } con números dentro de los rangos de latitud y longitud
const esPunto = (punto) =>
  Number.isFinite(punto?.lat) &&
  Number.isFinite(punto?.lng) &&
  Math.abs(punto.lat) <= 90 &&
  Math.abs(punto.lng) <= 180;

const MOTIVOS = ["registro", "login"];

function responder(res, status, cuerpo) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(cuerpo));
}

function leerJson(req, limite = 10_000) {
  return new Promise((resolve, reject) => {
    let datos = "";
    req.on("data", (trozo) => {
      datos += trozo;
      if (datos.length > limite) {
        reject(new Error("demasiado_grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(datos ? JSON.parse(datos) : {});
      } catch {
        reject(new Error("json_invalido"));
      }
    });
    req.on("error", reject);
  });
}

const STATUS = {
  email_invalido: 400,
  codigo_invalido: 400,
  sin_codigo: 400,
  vencido: 400,
  codigo_incorrecto: 400,
  demasiados_intentos: 429,
  espera: 429,
};

function createApp({
  store,
  enviarCorreo,
  calcularRuta = calcularRutaOrs,
  // crearPagos(...) de ./pagos, o null si firebase-admin no está configurado
  pagos = null,
  // createMercadoPagoPayments(...) of ./pagos, or null without MP_ACCESS_TOKEN
  // or firebase-admin
  mercadoPago = null,
  basePath = "/api/v1",
  logger = console,
}) {
  async function enviarCodigo(req, res, body) {
    const motivo = body.motivo;
    if (!MOTIVOS.includes(motivo)) {
      return responder(res, 400, {
        ok: false,
        codigoError: "motivo_invalido",
        error: 'El motivo debe ser "registro" o "login"',
      });
    }

    const emitido = store.emitir(body.email);
    if (!emitido.ok) return responder(res, STATUS[emitido.codigoError] ?? 400, emitido);

    const correo = renderCorreo({
      motivo,
      nombre: body.nombre,
      codigo: emitido.codigo,
      minutos: emitido.minutos,
      ip: (req.socket.remoteAddress || "").replace(/^::ffff:/, ""),
      dispositivo: body.dispositivo,
      fecha: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    });

    try {
      await enviarCorreo({ to: emitido.email, ...correo });
    } catch (error) {
      store.descartar(emitido.email);
      logger.error("No se pudo enviar el correo:", error.message);
      return responder(res, 502, {
        ok: false,
        codigoError: "correo_no_enviado",
        error: "No se pudo enviar el correo, intentá de nuevo",
      });
    }
    // Nunca se devuelve el código en la respuesta: solo llega por correo
    return responder(res, 200, { ok: true, minutos: emitido.minutos });
  }

  function verificarCodigo(req, res, body) {
    const resultado = store.verificar(body.email, body.codigo);
    if (!resultado.ok) return responder(res, STATUS[resultado.codigoError] ?? 400, resultado);
    return responder(res, 200, { ok: true });
  }

  // Ruta en carro entre dos puntos con OpenRouteService. La app la pide una vez al
  // aceptar un viaje, para ir hasta el pasajero: la llave de ORS nunca sale del
  // backend (docs/APIS.md).
  async function calcularRutaHandler(req, res, body) {
    if (!esPunto(body.origen) || !esPunto(body.destino)) {
      return responder(res, 400, {
        ok: false,
        codigoError: "ruta_invalida",
        error: "origen y destino deben ser { lat, lng }",
      });
    }

    try {
      const ruta = await calcularRuta(
        [body.origen.lng, body.origen.lat],
        [body.destino.lng, body.destino.lat],
      );
      return responder(res, 200, { ok: true, ...ruta });
    } catch (error) {
      logger.error("No se pudo calcular la ruta:", error.message);
      return responder(res, 502, {
        ok: false,
        codigoError: "ruta_no_disponible",
        error: "No se pudo calcular la ruta",
      });
    }
  }

  // El conductor confirma que recibió el efectivo (backend/src/pagos.js)
  async function pagoEnEfectivo(req, res, body) {
    if (!pagos) {
      return responder(res, 503, {
        ok: false,
        codigoError: "pagos_no_configurados",
        error: "Falta backend/serviceAccountKey.json para confirmar pagos",
      });
    }
    const { status, cuerpo } = await pagos.confirmarEfectivo(
      req.headers.authorization,
      body,
    );
    return responder(res, status, cuerpo);
  }

  // AI-assisted: see docs/AI_LOG.md #62
  // Mercado Pago Checkout Pro (backend/src/pagos.js). Without MP_ACCESS_TOKEN
  // or the service account they answer 503, like the cash payment.
  const mercadoPagoOff = {
    ok: false,
    codigoError: "pagos_no_configurados",
    error: "Missing MP_ACCESS_TOKEN or backend/serviceAccountKey.json",
  };
  const withMercadoPago = (handler) => async (req, res, body, query) => {
    if (!mercadoPago) return responder(res, 503, mercadoPagoOff);
    const { status, cuerpo } = await handler(req, body, query);
    return responder(res, status, cuerpo);
  };
  const startMercadoPago = withMercadoPago((req, body) =>
    mercadoPago.startPayment(req.headers.authorization, body),
  );
  const checkMercadoPago = withMercadoPago((req, body) =>
    mercadoPago.checkPayment(req.headers.authorization, body),
  );
  const mercadoPagoWebhook = withMercadoPago((req, body, query) =>
    mercadoPago.webhook(query, body),
  );
  // AI-assisted: see docs/AI_LOG.md #63
  // Split payments: the driver links their own Mercado Pago account
  const linkStatus = withMercadoPago((req) =>
    mercadoPago.linkStatus(req.headers.authorization),
  );
  const startLink = withMercadoPago((req) =>
    mercadoPago.startLink(req.headers.authorization),
  );
  const unlink = withMercadoPago((req) =>
    mercadoPago.unlink(req.headers.authorization),
  );

  // The pages after the checkout and after linking are HTML: they are seen
  // in the browser
  const htmlPages = {
    [`${basePath}/pagos/mercadopago/retorno`]: (query) =>
      mercadoPago.returnPage(query),
    [`${basePath}/pagos/mercadopago/oauth`]: (query) =>
      mercadoPago.oauthReturn(query),
  };
  async function sendHtmlPage(res, page, query) {
    const { status, html } = mercadoPago
      ? await page(query)
      : { status: 503, html: "<p>Mercado Pago no está configurado.</p>" };
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    const ruta = url.pathname;
    const query = Object.fromEntries(url.searchParams);

    if (req.method === "OPTIONS") return responder(res, 204, {});
    if (req.method === "GET" && ruta === `${basePath}/health`) {
      return responder(res, 200, { ok: true });
    }
    if (req.method === "GET" && htmlPages[ruta]) {
      try {
        return await sendHtmlPage(res, htmlPages[ruta], query);
      } catch (error) {
        logger.error(error);
        return responder(res, 500, { ok: false, error: "Error interno del servidor" });
      }
    }

    const rutas = {
      [`${basePath}/auth/enviar-codigo`]: enviarCodigo,
      [`${basePath}/auth/verificar-codigo`]: verificarCodigo,
      [`${basePath}/rutas`]: calcularRutaHandler,
      [`${basePath}/pagos/efectivo`]: pagoEnEfectivo,
      [`${basePath}/pagos/mercadopago`]: startMercadoPago,
      [`${basePath}/pagos/mercadopago/verificar`]: checkMercadoPago,
      [`${basePath}/pagos/mercadopago/webhook`]: mercadoPagoWebhook,
      [`${basePath}/pagos/mercadopago/vinculo`]: linkStatus,
      [`${basePath}/pagos/mercadopago/vincular`]: startLink,
      [`${basePath}/pagos/mercadopago/desvincular`]: unlink,
    };
    const manejador = rutas[ruta];
    if (!manejador) return responder(res, 404, { ok: false, error: "Ruta no encontrada" });
    if (req.method !== "POST") {
      return responder(res, 405, { ok: false, error: "Usá POST" });
    }

    let body;
    try {
      body = await leerJson(req);
    } catch {
      return responder(res, 400, { ok: false, codigoError: "json_invalido", error: "El cuerpo debe ser JSON" });
    }

    try {
      await manejador(req, res, body, query);
    } catch (error) {
      logger.error(error);
      responder(res, 500, { ok: false, error: "Error interno del servidor" });
    }
  });
}

module.exports = { createApp };
