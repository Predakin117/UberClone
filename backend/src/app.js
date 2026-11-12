// AI-assisted: see docs/AI_LOG.md #11, #21
// Servidor HTTP con el módulo nativo de Node (sin Express).
// Rutas (bajo /api/v1):
//   GET  /health
//   POST /auth/enviar-codigo     { email, nombre?, motivo: "registro" | "login", dispositivo? }
//   POST /auth/verificar-codigo  { email, codigo }
//   POST /rutas                  { origen: { lat, lng }, destino: { lat, lng } }
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
    "Access-Control-Allow-Headers": "Content-Type",
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

  return http.createServer(async (req, res) => {
    const ruta = (req.url || "").split("?")[0];

    if (req.method === "OPTIONS") return responder(res, 204, {});
    if (req.method === "GET" && ruta === `${basePath}/health`) {
      return responder(res, 200, { ok: true });
    }

    const rutas = {
      [`${basePath}/auth/enviar-codigo`]: enviarCodigo,
      [`${basePath}/auth/verificar-codigo`]: verificarCodigo,
      [`${basePath}/rutas`]: calcularRutaHandler,
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
      await manejador(req, res, body);
    } catch (error) {
      logger.error(error);
      responder(res, 500, { ok: false, error: "Error interno del servidor" });
    }
  });
}

module.exports = { createApp };
