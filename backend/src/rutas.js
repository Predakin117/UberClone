// AI-assisted: see docs/AI_LOG.md #21
// Rutas con OpenRouteService (docs/APIS.md, servicio 1). Es el único módulo del
// proyecto que llama a ORS: si se cambia de proveedor, solo cambia este archivo.
// Se llama una vez por solicitud, nunca en cada actualización de ubicación
// (sección 7 del enunciado). Datos de rutas: © OpenStreetMap contributors.
const ORS_DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car";
const TIEMPO_LIMITE_MS = 10_000;

// [longitud, latitud]: ORS usa este orden, al revés de react-native-maps
const esCoordenada = (punto) =>
  Array.isArray(punto) && punto.length === 2 && punto.every(Number.isFinite);

/**
 * Calcula la ruta en carro entre dos puntos [longitud, latitud].
 * Devuelve { distanceKm, durationMin, encodedPolyline }: la distancia con un
 * decimal, la duración en minutos enteros y la ruta como polyline codificada.
 * Lanza un error si falta la llave o si ORS no responde con una ruta.
 */
async function calcularRuta(
  origen,
  destino,
  { apiKey = process.env.ORS_API_KEY, fetchImpl = fetch } = {},
) {
  if (!apiKey) throw new Error("Falta ORS_API_KEY en backend/.env");
  if (!esCoordenada(origen) || !esCoordenada(destino)) {
    throw new Error("Las coordenadas deben ser [longitud, latitud]");
  }

  const response = await fetchImpl(ORS_DIRECTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ coordinates: [origen, destino] }),
    signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detalle = data?.error?.message ?? data?.error ?? "sin detalle";
    throw new Error(`OpenRouteService respondió ${response.status}: ${detalle}`);
  }

  // La respuesta JSON trae distance en metros, duration en segundos y
  // geometry como polyline codificada
  const ruta = data?.routes?.[0];
  if (!ruta?.summary || typeof ruta.geometry !== "string") {
    throw new Error("OpenRouteService no devolvió una ruta");
  }
  return {
    distanceKm: Math.round(ruta.summary.distance / 100) / 10,
    durationMin: Math.round(ruta.summary.duration / 60),
    encodedPolyline: ruta.geometry,
  };
}

module.exports = { calcularRuta, ORS_DIRECTIONS_URL };
