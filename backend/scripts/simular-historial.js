// AI-assisted: see docs/AI_LOG.md #25
// Crea 10 viajes terminados y pagados ("paid") a nombre de un conductor, para
// probar el historial y las ganancias sin hacer 10 viajes a mano.
//
// Uso (desde backend/):  npm run simular-historial -- <correo del conductor>
//
// Los viajes quedan repartidos entre hoy, esta semana (desde el lunes) y este
// mes, con efectivo y Mercado Pago y las 3 categorías. Los montos salen de
// calculateFare de src/config/pricing.js, la misma función de la app. Todos
// llevan passengerId "pasajero-simulado": npm run limpiar-simulados los borra.
// No llama a OpenRouteService: usa la distancia y la duración de respaldo de
// las rutas del simulador.
const { calculateFare } = require("../../src/config/pricing.js");
const { comprobarProyecto, iniciarFirebaseAdmin } = require("./proyecto");
const { LUGARES, PASAJERO_SIMULADO, RUTAS } = require("./simular-solicitud");

// Un viaje por fila: en qué periodo cae, la ruta (índice de RUTAS), la
// categoría, el método de pago, la propina y la calificación.
const PLAN = [
  { periodo: "hoy", ruta: 0, category: "economy", paymentMethod: "cash", tip: 0, rating: 5 },
  { periodo: "hoy", ruta: 1, category: "xl", paymentMethod: "mercadopago", tip: 2000, rating: 4 },
  { periodo: "hoy", ruta: 2, category: "premium", paymentMethod: "cash", tip: 0, rating: 5 },
  { periodo: "semana", ruta: 1, category: "economy", paymentMethod: "mercadopago", tip: 0, rating: 5 },
  { periodo: "semana", ruta: 2, category: "xl", paymentMethod: "cash", tip: 5000, rating: 3 },
  { periodo: "semana", ruta: 0, category: "premium", paymentMethod: "mercadopago", tip: 0, rating: 4 },
  { periodo: "mes", ruta: 2, category: "economy", paymentMethod: "cash", tip: 1000, rating: 5 },
  { periodo: "mes", ruta: 0, category: "xl", paymentMethod: "mercadopago", tip: 0, rating: 5 },
  { periodo: "mes", ruta: 1, category: "premium", paymentMethod: "cash", tip: 3000, rating: 4 },
  { periodo: "mes", ruta: 0, category: "economy", paymentMethod: "mercadopago", tip: 0, rating: 5 },
];

const MINUTO_MS = 60_000;

// Inicio del día, de la semana (lunes) y del mes de "ahora", en la hora local del PC
function iniciosDelPeriodo(ahora) {
  const dia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const diasDesdeElLunes = (dia.getDay() + 6) % 7;
  const semana = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() - diasDesdeElLunes);
  const mes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  return { dia, semana, mes };
}

// n fechas repartidas por igual entre inicio y fin (sin tocar los extremos)
function fechasEntre(inicio, fin, n) {
  const paso = (fin.getTime() - inicio.getTime()) / n;
  return Array.from(
    { length: n },
    (_, i) => new Date(Math.round(inicio.getTime() + paso * (i + 0.5))),
  );
}

/**
 * Rango [inicio, fin) de cada periodo, sin que se pisen: "semana" son los días
 * de esta semana antes de hoy y "mes", los días de este mes antes de esta
 * semana. Si un rango queda vacío (hoy es lunes, o el mes empezó esta semana),
 * esos viajes se pasan a un rango que igual cae dentro del periodo pedido.
 */
function rangosPorPeriodo(ahora) {
  const { dia, semana, mes } = iniciosDelPeriodo(ahora);
  const hoy = { inicio: dia, fin: ahora };
  const estaSemana = semana < dia ? { inicio: semana, fin: dia } : hoy;
  const finDelMes = semana > mes ? semana : dia;
  const esteMes = finDelMes > mes ? { inicio: mes, fin: finDelMes } : hoy;
  return { hoy, semana: estaSemana, mes: esteMes };
}

/**
 * Arma los 10 viajes del PLAN para el conductor driverId, con los campos de la
 * sección 6 del enunciado (más routePolyline, como el simulador). createdAt y
 * completedAt son Date: main los convierte a Timestamp de Firestore.
 */
function crearViajesDelHistorial({ driverId, ahora }) {
  const rangos = rangosPorPeriodo(ahora);
  const fechas = {};
  for (const periodo of Object.keys(rangos)) {
    const cuantos = PLAN.filter((fila) => fila.periodo === periodo).length;
    fechas[periodo] = fechasEntre(rangos[periodo].inicio, rangos[periodo].fin, cuantos);
  }

  return PLAN.map((fila, numero) => {
    const ruta = RUTAS[fila.ruta];
    const { distanceKm, durationMin } = ruta.respaldo;
    const montos = calculateFare({
      distanceKm,
      durationMin,
      category: fila.category,
      tip: fila.tip,
    });
    const completedAt = fechas[fila.periodo].shift();
    const esEfectivo = fila.paymentMethod === "cash";
    return {
      driverId,
      passengerId: PASAJERO_SIMULADO,
      origin: LUGARES[ruta.origen],
      destination: LUGARES[ruta.destino],
      distanceKm,
      durationMin,
      routePolyline: null,
      category: fila.category,
      fare: montos.fare,
      commission: montos.commission,
      tip: montos.tip,
      driverEarnings: montos.driverEarnings,
      commissionRate: montos.commissionRate,
      paymentMethod: fila.paymentMethod,
      // Lo mismo que escribirá el backend al confirmar cada pago
      paymentStatus: esEfectivo ? "cash" : "approved",
      paymentId: esEfectivo ? null : `simulado-${numero + 1}`,
      status: "paid",
      rating: fila.rating,
      createdAt: new Date(completedAt.getTime() - durationMin * MINUTO_MS),
      completedAt,
    };
  });
}

async function main() {
  const [correo] = process.argv.slice(2);
  if (!correo || !correo.includes("@")) {
    throw new Error("Uso: npm run simular-historial -- <correo del conductor>");
  }
  const proyecto = comprobarProyecto();
  iniciarFirebaseAdmin();
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");

  let usuario;
  try {
    usuario = await getAuth().getUserByEmail(correo);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new Error(`No hay ninguna cuenta con el correo ${correo} en ${proyecto}`);
    }
    throw error;
  }

  const viajes = crearViajesDelHistorial({ driverId: usuario.uid, ahora: new Date() });
  const db = getFirestore();
  const lote = db.batch();
  for (const viaje of viajes) {
    lote.set(db.collection("trips").doc(), {
      ...viaje,
      createdAt: Timestamp.fromDate(viaje.createdAt),
      completedAt: Timestamp.fromDate(viaje.completedAt),
    });
  }
  await lote.commit();

  const total = viajes.reduce((suma, viaje) => suma + viaje.driverEarnings, 0);
  console.log(`${viajes.length} viajes "paid" creados en ${proyecto} para ${correo} (uid ${usuario.uid})`);
  for (const viaje of viajes) {
    console.log(
      `  ${viaje.completedAt.toLocaleString("es-CO")}  ${viaje.category.padEnd(7)} ${viaje.paymentMethod.padEnd(11)} tarifa ${viaje.fare}, ganancia ${viaje.driverEarnings}`,
    );
  }
  console.log(`  Ganancia neta total: ${total} COP. Para borrarlos: npm run limpiar-simulados`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  crearViajesDelHistorial,
  rangosPorPeriodo,
  iniciosDelPeriodo,
  PLAN,
};
