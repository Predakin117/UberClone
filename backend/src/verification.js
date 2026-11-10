// AI-assisted: see docs/AI_LOG.md #11
// Lógica del código de verificación (sin dependencias, se prueba con node --test).
// Guarda los códigos en memoria: si se reinicia el servidor, los códigos pendientes
// se pierden y el conductor solo tiene que pedir uno nuevo.
const crypto = require("node:crypto");

const MENSAJES = {
  email_invalido: "El correo no es válido",
  espera: "Esperá un momento antes de pedir otro código",
  sin_codigo: "Primero pedí un código",
  vencido: "El código venció, pedí uno nuevo",
  demasiados_intentos: "Demasiados intentos, pedí un código nuevo",
  codigo_incorrecto: "El código es incorrecto",
  codigo_invalido: "El código debe tener 6 dígitos",
};

const fallo = (codigoError, extra = {}) => ({
  ok: false,
  codigoError,
  error: MENSAJES[codigoError],
  ...extra,
});

const normalizarEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashCodigo = (codigo, sal) =>
  crypto.createHash("sha256").update(`${sal}:${codigo}`).digest();

function createVerificationStore({
  ttlMinutes = 10,
  maxAttempts = 5,
  cooldownSeconds = 60,
  now = () => Date.now(),
} = {}) {
  const pendientes = new Map(); // email -> { hash, sal, expira, intentos, creado }

  function emitir(emailCrudo) {
    const email = normalizarEmail(emailCrudo);
    if (!esEmailValido(email)) return fallo("email_invalido");

    const previo = pendientes.get(email);
    if (previo && now() - previo.creado < cooldownSeconds * 1000) {
      const faltan = Math.ceil(
        (cooldownSeconds * 1000 - (now() - previo.creado)) / 1000,
      );
      return fallo("espera", { reintentarEn: faltan });
    }

    const codigo = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const sal = crypto.randomBytes(16).toString("hex");
    pendientes.set(email, {
      hash: hashCodigo(codigo, sal),
      sal,
      expira: now() + ttlMinutes * 60_000,
      intentos: 0,
      creado: now(),
    });
    return { ok: true, email, codigo, minutos: ttlMinutes };
  }

  function verificar(emailCrudo, codigoCrudo) {
    const email = normalizarEmail(emailCrudo);
    const codigo = String(codigoCrudo ?? "").trim();
    if (!/^\d{6}$/.test(codigo)) return fallo("codigo_invalido");

    const reg = pendientes.get(email);
    if (!reg) return fallo("sin_codigo");
    if (now() > reg.expira) {
      pendientes.delete(email);
      return fallo("vencido");
    }

    reg.intentos += 1;
    const correcto = crypto.timingSafeEqual(reg.hash, hashCodigo(codigo, reg.sal));
    if (correcto) {
      pendientes.delete(email);
      return { ok: true, email };
    }
    if (reg.intentos >= maxAttempts) {
      pendientes.delete(email);
      return fallo("demasiados_intentos");
    }
    return fallo("codigo_incorrecto", { intentosRestantes: maxAttempts - reg.intentos });
  }

  // Si el correo no se pudo enviar, se borra el código para dejar pedir otro de una
  function descartar(emailCrudo) {
    pendientes.delete(normalizarEmail(emailCrudo));
  }

  return { emitir, verificar, descartar };
}

module.exports = { createVerificationStore, normalizarEmail, esEmailValido, MENSAJES };
