const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateFare } = require("../../src/config/pricing.js");
const { crearViajesDelHistorial } = require("../scripts/simular-historial");
const { enLotes } = require("../scripts/limpiar-simulados");

// Campos de la tabla de la sección 6 del enunciado, más routePolyline
const CAMPOS = [
  "driverId", "passengerId", "origin", "destination", "distanceKm",
  "durationMin", "category", "fare", "commission", "tip", "driverEarnings",
  "commissionRate", "paymentMethod", "paymentStatus", "paymentId", "status",
  "rating", "createdAt", "completedAt", "routePolyline",
];

// Miércoles 11 de noviembre de 2026, 3:00 p. m. (hora local del PC)
const MIERCOLES = new Date(2026, 10, 11, 15, 0);
const viajes = (ahora = MIERCOLES) =>
  crearViajesDelHistorial({ driverId: "uid-conductor", ahora });

const enRango = (fecha, inicio, fin) => fecha >= inicio && fecha < fin;

test("crea 10 viajes paid del conductor y del pasajero simulado, con los campos del enunciado", () => {
  const lista = viajes();
  assert.equal(lista.length, 10);
  for (const viaje of lista) {
    assert.deepEqual(Object.keys(viaje).sort(), [...CAMPOS].sort());
    assert.equal(viaje.status, "paid");
    assert.equal(viaje.driverId, "uid-conductor");
    assert.equal(viaje.passengerId, "pasajero-simulado");
    assert.ok(viaje.createdAt < viaje.completedAt);
  }
});

test("los montos son los de calculateFare, en pesos enteros", () => {
  for (const viaje of viajes()) {
    const esperado = calculateFare({
      distanceKm: viaje.distanceKm,
      durationMin: viaje.durationMin,
      category: viaje.category,
      tip: viaje.tip,
    });
    assert.equal(viaje.fare, esperado.fare);
    assert.equal(viaje.commission, esperado.commission);
    assert.equal(viaje.driverEarnings, esperado.driverEarnings);
    assert.equal(viaje.commissionRate, esperado.commissionRate);
    assert.equal(viaje.driverEarnings, viaje.fare - viaje.commission + viaje.tip);
    for (const monto of [viaje.fare, viaje.commission, viaje.tip, viaje.driverEarnings]) {
      assert.ok(Number.isInteger(monto));
    }
  }
});

test("mezcla efectivo y Mercado Pago, las 3 categorías y algunas propinas", () => {
  const lista = viajes();
  assert.deepEqual(
    [...new Set(lista.map((v) => v.category))].sort(),
    ["economy", "premium", "xl"],
  );
  const efectivo = lista.filter((v) => v.paymentMethod === "cash");
  const mercadoPago = lista.filter((v) => v.paymentMethod === "mercadopago");
  assert.equal(efectivo.length + mercadoPago.length, 10);
  assert.ok(efectivo.length > 0 && mercadoPago.length > 0);
  for (const viaje of efectivo) {
    assert.equal(viaje.paymentStatus, "cash");
    assert.equal(viaje.paymentId, null);
  }
  for (const viaje of mercadoPago) {
    assert.equal(viaje.paymentStatus, "approved");
    assert.match(viaje.paymentId, /^simulado-\d+$/);
  }
  assert.ok(lista.some((v) => v.tip > 0));
});

test("un miércoles: 3 viajes hoy, 3 antes en la semana y 4 antes en el mes", () => {
  const fechas = viajes().map((v) => v.completedAt);
  const lunes = new Date(2026, 10, 9);
  const hoy = new Date(2026, 10, 11);
  const primeroDelMes = new Date(2026, 10, 1);
  assert.equal(fechas.filter((f) => enRango(f, hoy, MIERCOLES)).length, 3);
  assert.equal(fechas.filter((f) => enRango(f, lunes, hoy)).length, 3);
  assert.equal(fechas.filter((f) => enRango(f, primeroDelMes, lunes)).length, 4);
});

test("un lunes, los de la semana caen hoy y ninguno queda en el futuro", () => {
  const lunes = new Date(2026, 10, 9, 10, 0);
  const fechas = viajes(lunes).map((v) => v.completedAt);
  const inicioDelLunes = new Date(2026, 10, 9);
  assert.equal(fechas.filter((f) => enRango(f, inicioDelLunes, lunes)).length, 6);
  assert.equal(
    fechas.filter((f) => enRango(f, new Date(2026, 10, 1), inicioDelLunes)).length,
    4,
  );
});

test("si el mes empezó hoy, los del mes no se salen del mes", () => {
  // Martes 1 de diciembre: la semana empezó el lunes 30 de noviembre
  const martes = new Date(2026, 11, 1, 10, 0);
  const lista = viajes(martes);
  const delMes = lista.filter((_, i) => i >= 6).map((v) => v.completedAt);
  for (const fecha of delMes) {
    assert.ok(enRango(fecha, new Date(2026, 11, 1), martes));
  }
  for (const viaje of lista) assert.ok(viaje.completedAt <= martes);
});

test("limpiar-simulados borra en lotes de máximo 500", () => {
  const ids = Array.from({ length: 1001 }, (_, i) => i);
  assert.deepEqual(enLotes(ids).map((lote) => lote.length), [500, 500, 1]);
  assert.deepEqual(enLotes([]), []);
});
