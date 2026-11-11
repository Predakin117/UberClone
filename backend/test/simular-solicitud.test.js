const test = require("node:test");
const assert = require("node:assert/strict");
const { crearSolicitud, RUTAS, LUGARES } = require("../scripts/simular-solicitud");

// Campos de la tabla de la sección 6 del enunciado (los mismos de TRIP_FIELDS en
// src/services/trips.js), más routePolyline para dibujar la ruta
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
    [...CAMPOS_DEL_ENUNCIADO, "routePolyline"].sort(),
  );
  assert.equal(viaje.status, "requested");
  assert.equal(viaje.driverId, null);
  assert.equal(viaje.category, "xl");
  assert.equal(viaje.paymentMethod, "cash");
  assert.equal(viaje.routePolyline, "abc");
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
