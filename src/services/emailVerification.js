// AI-assisted: see docs/AI_LOG.md #11
// Código de verificación por correo: la app le pide al backend (carpeta backend/)
// que envíe el código y luego lo verifica. La app nunca envía correos ni tiene la
// clave del Gmail. Ninguna función lanza errores: siempre devuelven
// { ok: true, ... } o { ok: false, error, codigoError }.
//
// Uso en las pantallas:
//   await enviarCodigo({ email, nombre, motivo: "registro" }); // o "login"
//   const res = await verificarCodigo({ email, codigo });       // res.ok === true → verificado
import * as Device from "expo-device";
import { env } from "../config/env";

const TIEMPO_LIMITE_MS = 15_000;

export const MOTIVOS = { REGISTRO: "registro", LOGIN: "login" };

export const isBackendConfigured = Boolean(env.backendApiUrl);

const nombreDispositivo = () =>
  [Device.manufacturer, Device.modelName].filter(Boolean).join(" ") ||
  "App UberClone";

const llamar = async (ruta, body) => {
  if (!isBackendConfigured) {
    return {
      ok: false,
      codigoError: "sin_backend",
      error: "Falta EXPO_PUBLIC_BACKEND_API_URL en el .env",
    };
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);
  try {
    const response = await fetch(`${env.backendApiUrl}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controlador.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok) return data;
    return {
      ...data,
      ok: false,
      error: data.error ?? "Ocurrió un error, intentá de nuevo",
    };
  } catch {
    return {
      ok: false,
      codigoError: "sin_conexion",
      error: "No se pudo conectar con el servidor",
    };
  } finally {
    clearTimeout(temporizador);
  }
};

export const enviarCodigo = ({ email, nombre, motivo }) =>
  llamar("/auth/enviar-codigo", {
    email: email?.trim(),
    nombre: nombre?.trim(),
    motivo,
    dispositivo: nombreDispositivo(),
  });

export const verificarCodigo = ({ email, codigo }) =>
  llamar("/auth/verificar-codigo", {
    email: email?.trim(),
    codigo: String(codigo ?? "").trim(),
  });
