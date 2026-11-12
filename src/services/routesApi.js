// AI-assisted: see docs/AI_LOG.md #21
// Rutas calculadas por el backend (POST /api/v1/rutas), que llama a
// OpenRouteService: la llave nunca está en la app (docs/APIS.md). Es el único
// módulo de la app que pide rutas. No lanza errores: devuelve { ok: true,
// distanceKm, durationMin, encodedPolyline } o { ok: false, codigoError }.
import { env } from "../config/env";

const TIEMPO_LIMITE_MS = 15_000;

// origin y destination son { lat, lng }
export const fetchRoute = async (origin, destination) => {
  if (!env.backendApiUrl) return { ok: false, codigoError: "sin_backend" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIEMPO_LIMITE_MS);
  try {
    const response = await fetch(`${env.backendApiUrl}/rutas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origen: origin, destino: destination }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.ok && typeof data.encodedPolyline === "string") {
      return data;
    }
    return { ok: false, codigoError: data.codigoError ?? "ruta_no_disponible" };
  } catch {
    return { ok: false, codigoError: "sin_conexion" };
  } finally {
    clearTimeout(timer);
  }
};
