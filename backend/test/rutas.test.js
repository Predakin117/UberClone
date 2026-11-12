const test = require("node:test");
const assert = require("node:assert/strict");
const { calcularRuta, ORS_DIRECTIONS_URL } = require("../src/rutas");

const UDEA = [-75.56876, 6.26798];
const OLAYA = [-75.58904, 6.22002];

// fetch simulado: guarda la petición y responde lo que se le indique
const fetchFalso = (status, body) => {
  const llamadas = [];
  const fetchImpl = async (url, opciones) => {
    llamadas.push({ url, opciones });
    return {
      ok: status < 400,
      status,
      json: async () => {
        if (body === undefined) throw new Error("sin JSON");
        return body;
      },
    };
  };
  return { fetchImpl, llamadas };
};

const respuestaOrs = {
  routes: [
    { summary: { distance: 8523.4, duration: 1310.2 }, geometry: "abc~d@" },
  ],
};

test("pide la ruta en carro con la llave y las coordenadas [longitud, latitud]", async () => {
  const { fetchImpl, llamadas } = fetchFalso(200, respuestaOrs);
  await calcularRuta(UDEA, OLAYA, { apiKey: "llave-de-prueba", fetchImpl });

  assert.equal(llamadas.length, 1);
  const { url, opciones } = llamadas[0];
  assert.equal(url, ORS_DIRECTIONS_URL);
  assert.equal(opciones.method, "POST");
  assert.equal(opciones.headers.Authorization, "llave-de-prueba");
  assert.deepEqual(JSON.parse(opciones.body), { coordinates: [UDEA, OLAYA] });
});

test("devuelve kilómetros con un decimal, minutos enteros y la polyline", async () => {
  const { fetchImpl } = fetchFalso(200, respuestaOrs);
  const ruta = await calcularRuta(UDEA, OLAYA, { apiKey: "k", fetchImpl });
  assert.deepEqual(ruta, {
    distanceKm: 8.5,
    durationMin: 22,
    encodedPolyline: "abc~d@",
  });
});

test("falla sin llave o con coordenadas mal formadas, sin llamar a ORS", async () => {
  const { fetchImpl, llamadas } = fetchFalso(200, respuestaOrs);
  await assert.rejects(
    calcularRuta(UDEA, OLAYA, { apiKey: "", fetchImpl }),
    /ORS_API_KEY/,
  );
  await assert.rejects(
    calcularRuta([6.26798], OLAYA, { apiKey: "k", fetchImpl }),
    /longitud, latitud/,
  );
  assert.equal(llamadas.length, 0);
});

test("explica el error cuando ORS responde con un código de error", async () => {
  const { fetchImpl } = fetchFalso(403, {
    error: { code: 2099, message: "Access to this API has been disallowed" },
  });
  await assert.rejects(
    calcularRuta(UDEA, OLAYA, { apiKey: "k", fetchImpl }),
    /403: Access to this API has been disallowed/,
  );
});

test("falla si la respuesta no trae una ruta", async () => {
  const { fetchImpl } = fetchFalso(200, { routes: [] });
  await assert.rejects(
    calcularRuta(UDEA, OLAYA, { apiKey: "k", fetchImpl }),
    /no devolvió una ruta/,
  );
});
