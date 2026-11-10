// AI-assisted: see docs/AI_LOG.md #13
// Convierte la respuesta del backend del código de verificación en una clave de
// src/i18n/strings.js, para mostrar el error en el idioma de la app y no el texto
// que manda el servidor.

// codigoError que la pantalla sabe explicar. Los demás usan el mensaje genérico.
export const KNOWN_VERIFICATION_ERRORS = [
  "email_invalido",
  "espera",
  "sin_codigo",
  "vencido",
  "demasiados_intentos",
  "codigo_incorrecto",
  "codigo_invalido",
  "correo_no_enviado",
  "sin_backend",
  "sin_conexion",
];

// Los mismos 60 segundos que exige el backend entre un envío y otro
export const RESEND_SECONDS = 60;

export const isValidCode = (code) => /^\d{6}$/.test(code.trim());

/**
 * Devuelve { key, values }: la clave del texto y los números que lleva
 * ({seconds} para esperar y {attempts} para los intentos que quedan).
 */
export const describeVerificationError = (result) => {
  const code = KNOWN_VERIFICATION_ERRORS.includes(result?.codigoError)
    ? result.codigoError
    : "generico";
  return {
    key: `verify.error.${code}`,
    values: {
      seconds: result?.reintentarEn ?? RESEND_SECONDS,
      attempts: result?.intentosRestantes ?? 0,
    },
  };
};
