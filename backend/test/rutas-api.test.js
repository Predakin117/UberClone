const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createVerificationStore } = require("../src/verification");

// Levanta el servidor con un calcularRuta simulado: no llama a OpenRouteService
async function levantar(calcularRuta) {
  const llamadas = [];
  const app = createApp({
    store: createVerificationStore(),
    enviarCorreo: async () => {},
    calcularRuta: async (origen, destino) => {
      llamadas.push({ origen, destino });
      return calcularRuta(origen, destino);
    },
    logger: { error() {} },
  });
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${app.address().port}/api/v1`;
  const post = async (body) => {
    const res = await fetch(`${base}/rutas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };
  return { app, post, llamadas };
}

const CONDUCTOR = { lat: 6.2442, lng: -75.5812 };
const RECOGIDA = { lat: 6.26798, lng: -75.56876 };
const RUTA = { distanceKm: 3.1, durationMin: 7, encodedPolyline: "abc~d@" };

test("devuelve la ruta y pide a ORS las coordenadas como [longitud, latitud]", async (t) => {
  const { app, post, llamadas } = await levantar(async () => RUTA);
  t.after(() => app.close());

  const r = await post({ origen: CONDUCTOR, destino: RECOGIDA });
  assert.deepEqual(r, { status: 200, body: { ok: true, ...RUTA } });
  assert.deepEqual(llamadas, [
    { origen: [-75.5812, 6.2442], destino: [-75.56876, 6.26798] },
  ]);
});

test("rechaza puntos que no son { lat, lng } sin llamar a ORS", async (t) => {
  const { app, post, llamadas } = await levantar(async () => RUTA);
  t.after(() => app.close());

  for (const body of [
    {},
    { origen: CONDUCTOR },
    { origen: CONDUCTOR, destino: { lat: "6.2", lng: -75.5 } },
    { origen: CONDUCTOR, destino: { lat: 95, lng: -75.5 } },
  ]) {
    const r = await post(body);
    assert.equal(r.status, 400);
    assert.equal(r.body.codigoError, "ruta_invalida");
  }
  assert.equal(llamadas.length, 0);
});

test("responde 502 si ORS falla, sin mostrar el detalle del error", async (t) => {
  const { app, post } = await levantar(async () => {
    throw new Error("OpenRouteService respondió 403: llave inválida");
  });
  t.after(() => app.close());

  const r = await post({ origen: CONDUCTOR, destino: RECOGIDA });
  assert.equal(r.status, 502);
  assert.equal(r.body.codigoError, "ruta_no_disponible");
  assert.ok(!JSON.stringify(r.body).includes("llave"));
});
