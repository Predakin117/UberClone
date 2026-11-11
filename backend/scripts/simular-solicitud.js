// AI-assisted: see docs/AI_LOG.md #21
// Simulador mínimo: crea UNA solicitud "requested" en trips para probar la app
// mientras llega la API del pasajero de la profesora.
//
// Uso (desde backend/):  npm run simular -- [categoria] [metodoDePago] [ruta]
//   categoria:    economy (por defecto), xl o premium
//   metodoDePago: cash (por defecto), mercadopago o stripe
//   ruta:         1, 2 o 3 (por defecto, una al azar)
//
// Usa firebase-admin con backend/serviceAccountKey.json, que no pasa por las
// reglas de Firestore. La ruta sale de OpenRouteService (backend/src/rutas.js);
// si falla, se usan la distancia y la duración de respaldo de cada ruta.
const fs = require("node:fs");
const path = require("node:path");
const { calcularRuta } = require("../src/rutas");

const CATEGORIAS = ["economy", "xl", "premium"];
const METODOS_DE_PAGO = ["mercadopago", "stripe", "cash"];
const CLAVE = path.join(__dirname, "..", "serviceAccountKey.json");

// Lugares de Medellín. Coordenadas y direcciones consultadas una sola vez en
// Nominatim (© OpenStreetMap contributors), como pide docs/APIS.md.
const LUGARES = {
  udea: {
    lat: 6.26798,
    lng: -75.56876,
    address: "Universidad de Antioquia, Calle 67 #53-108, Medellín",
  },
  olaya: {
    lat: 6.22002,
    lng: -75.58904,
    address: "Aeropuerto Olaya Herrera, Calle 3B, Guayabal, Medellín",
  },
  estadio: {
    lat: 6.25683,
    lng: -75.59015,
    address: "Estadio Atanasio Girardot, Carrera 72, Laureles, Medellín",
  },
  tesoro: {
    lat: 6.19702,
    lng: -75.55918,
    address: "El Tesoro Parque Comercial, Calle 1A Sur #1 Sur-45, El Poblado, Medellín",
  },
  botero: {
    lat: 6.25185,
    lng: -75.56864,
    address: "Plaza Botero, La Candelaria, Medellín",
  },
};

// Rutas de ejemplo. El respaldo, por si ORS falla, son los valores que devolvió
// ORS para cada ruta el 2026-11-11 (sin tráfico, por eso los minutos son pocos).
const RUTAS = [
  { origen: "udea", destino: "olaya", respaldo: { distanceKm: 8.3, durationMin: 13 } },
  { origen: "estadio", destino: "tesoro", respaldo: { distanceKm: 11, durationMin: 19 } },
  { origen: "botero", destino: "estadio", respaldo: { distanceKm: 3.3, durationMin: 6 } },
];

const aOrs = ({ lat, lng }) => [lng, lat];

/**
 * Arma el documento del viaje con los campos de la sección 6 del enunciado, más
 * routePolyline para dibujar la ruta. Los montos quedan vacíos: la app los
 * calcula con calculateFare al cerrar el viaje.
 */
function crearSolicitud({ ruta, categoria, metodoDePago, calculada, ahora }) {
  return {
    driverId: null,
    passengerId: "pasajero-simulado",
    origin: LUGARES[ruta.origen],
    destination: LUGARES[ruta.destino],
    distanceKm: calculada.distanceKm,
    durationMin: calculada.durationMin,
    routePolyline: calculada.encodedPolyline ?? null,
    category: categoria,
    fare: null,
    commission: null,
    tip: 0,
    driverEarnings: null,
    commissionRate: null,
    paymentMethod: metodoDePago,
    paymentStatus: null,
    paymentId: null,
    status: "requested",
    rating: null,
    createdAt: ahora,
    completedAt: null,
  };
}

async function main() {
  const [categoria = "economy", metodoDePago = "cash", numeroDeRuta] =
    process.argv.slice(2);
  if (!CATEGORIAS.includes(categoria)) {
    throw new Error(`Categoría inválida "${categoria}": usa ${CATEGORIAS.join(", ")}`);
  }
  if (!METODOS_DE_PAGO.includes(metodoDePago)) {
    throw new Error(
      `Método de pago inválido "${metodoDePago}": usa ${METODOS_DE_PAGO.join(", ")}`,
    );
  }
  const indice =
    numeroDeRuta === undefined
      ? Math.floor(Math.random() * RUTAS.length)
      : Number(numeroDeRuta) - 1;
  if (!RUTAS[indice]) {
    throw new Error(`Ruta inválida "${numeroDeRuta}": usa un número del 1 al ${RUTAS.length}`);
  }
  if (!fs.existsSync(CLAVE)) {
    throw new Error("Falta backend/serviceAccountKey.json (descárgala de la consola de Firebase)");
  }

  const ruta = RUTAS[indice];
  let calculada;
  let fuente = "OpenRouteService";
  try {
    calculada = await calcularRuta(
      aOrs(LUGARES[ruta.origen]),
      aOrs(LUGARES[ruta.destino]),
    );
  } catch (error) {
    console.warn(`No se pudo calcular la ruta (${error.message}); uso los valores de respaldo.`);
    calculada = ruta.respaldo;
    fuente = "respaldo";
  }

  // Se carga aquí para que las pruebas de crearSolicitud no necesiten Firebase
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");
  initializeApp({ credential: cert(CLAVE) });

  const viaje = crearSolicitud({
    ruta,
    categoria,
    metodoDePago,
    calculada,
    ahora: FieldValue.serverTimestamp(),
  });
  const documento = await getFirestore().collection("trips").add(viaje);

  console.log(`Solicitud creada: trips/${documento.id}`);
  console.log(`  ${viaje.origin.address} → ${viaje.destination.address}`);
  console.log(
    `  ${viaje.distanceKm} km, ${viaje.durationMin} min, ${categoria}, ${metodoDePago} (ruta: ${fuente})`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { crearSolicitud, RUTAS, LUGARES, CATEGORIAS, METODOS_DE_PAGO };
