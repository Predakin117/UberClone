const test = require("node:test");
const assert = require("node:assert/strict");
const {
  crearSolicitud,
  leerVariableEnv,
  revisarProyecto,
  RUTAS,
  LUGARES,
  PASAJERO_DE_EJEMPLO,
} = require("../scripts/simular-solicitud");

test("no deja escribir si la clave es de otro proyecto que la app", () => {
  // Lo que pasó el 2026-11-11: la clave era de otro proyecto de Firebase
  assert.match(
    revisarProyecto("biblioteca-clase", "uber-clone-ba0e2"),
    /biblioteca-clase.*uber-clone-ba0e2/,
  );
  assert.match(revisarProyecto("uber-clone-ba0e2", null), /no se puede comprobar/);
  assert.equal(revisarProyecto("uber-clone-ba0e2", "uber-clone-ba0e2"), null);
});

test("lee el proyecto de la app del .env de la raíz", () => {
  const env = [
    "# comentario",
    "EXPO_PUBLIC_FIREBASE_API_KEY=abc",
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID="uber-clone-ba0e2"',
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID_EXTRA=otro",
  ].join("\r\n");
  assert.equal(
    leerVariableEnv(env, "EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
    "uber-clone-ba0e2",
  );
  assert.equal(leerVariableEnv(env, "NO_EXISTE"), null);
  assert.equal(leerVariableEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID=", "EXPO_PUBLIC_FIREBASE_PROJECT_ID"), null);
});

// Campos de la tabla de la sección 6 del enunciado (los mismos de TRIP_FIELDS en
// src/services/trips.js), más routePolyline para dibujar la ruta.
// AI-assisted: see docs/AI_LOG.md #31
// passengerName and passengerPhone are extra fields of the example passenger.
const CAMPOS_EXTRA = ["routePolyline", "passengerName", "passengerPhone"];
const CAMPOS_DEL_ENUNCIADO = [
  "driverId", "passengerId", "origin", "destination", "distanceKm",
  "durationMin", "category", "fare", "commission", "tip", "driverEarnings",
  "commissionRate", "paymentMethod", "paymentStatus", "paymentId", "status",
  "rating", "createdAt", "completedAt",
];

const solicitud = () =>
  crearSolicitud({
    ruta: RUTAS[0],
    categoria: "xl",
    metodoDePago: "cash",
    calculada: { distanceKm: 7.2, durationMin: 20, encodedPolyline: "abc" },
    ahora: "hora del servidor",
  });

test("crea una solicitud requested, sin conductor, con los campos del enunciado", () => {
  const viaje = solicitud();
  assert.deepEqual(
    Object.keys(viaje).sort(),
    [...CAMPOS_DEL_ENUNCIADO, ...CAMPOS_EXTRA].sort(),
  );
  assert.equal(viaje.status, "requested");
  assert.equal(viaje.driverId, null);
  assert.equal(viaje.category, "xl");
  assert.equal(viaje.paymentMethod, "cash");
  assert.equal(viaje.routePolyline, "abc");
  assert.equal(viaje.passengerName, PASAJERO_DE_EJEMPLO.name);
  assert.equal(viaje.passengerPhone, PASAJERO_DE_EJEMPLO.phone);
  assert.match(viaje.passengerPhone, /^\+\d{8,15}$/);
});

test("usa origin y destination como { lat, lng, address }", () => {
  const viaje = solicitud();
  for (const punto of [viaje.origin, viaje.destination]) {
    assert.deepEqual(Object.keys(punto).sort(), ["address", "lat", "lng"]);
  }
});

test("sin polyline (valores de respaldo) guarda routePolyline en null", () => {
  const viaje = crearSolicitud({
    ruta: RUTAS[1],
    categoria: "economy",
    metodoDePago: "mercadopago",
    calculada: RUTAS[1].respaldo,
    ahora: "hora",
  });
  assert.equal(viaje.routePolyline, null);
  assert.equal(viaje.distanceKm, RUTAS[1].respaldo.distanceKm);
});

test("cada ruta de ejemplo usa lugares que existen y tiene respaldo", () => {
  for (const ruta of RUTAS) {
    assert.ok(LUGARES[ruta.origen] && LUGARES[ruta.destino]);
    assert.ok(ruta.respaldo.distanceKm > 0 && ruta.respaldo.durationMin > 0);
  }
});
