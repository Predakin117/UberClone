const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { crearPagos, leerToken } = require("../src/pagos");
const { createVerificationStore } = require("../src/verification");

// firebase-admin simulado: Auth acepta un token por conductor y Firestore guarda
// los viajes en memoria. Cada update queda anotado para revisar qué se escribió.
function firebaseSimulado(viajes) {
  const datos = new Map(Object.entries(structuredClone(viajes)));
  const escrituras = [];
  const tokens = { "token-ana": "uid-ana", "token-beto": "uid-beto" };
  const auth = {
    async verifyIdToken(token) {
      if (!tokens[token]) throw new Error("auth/argument-error");
      return { uid: tokens[token] };
    },
  };
  const db = {
    collection: (nombre) => ({ doc: (id) => ({ ruta: `${nombre}/${id}`, id }) }),
    async runTransaction(fn) {
      const transaccion = {
        async get(referencia) {
          const viaje = datos.get(referencia.id);
          return { exists: viaje !== undefined, data: () => structuredClone(viaje) };
        },
        update(referencia, cambios) {
          escrituras.push({ ruta: referencia.ruta, cambios });
          datos.set(referencia.id, { ...datos.get(referencia.id), ...cambios });
        },
      };
      return fn(transaccion);
    },
  };
  return { auth, db, datos, escrituras };
}

const VIAJES = {
  efectivo: { driverId: "uid-ana", paymentMethod: "cash", status: "completed", paymentStatus: null },
  tarjeta: { driverId: "uid-ana", paymentMethod: "mercadopago", status: "completed", paymentStatus: null },
  enCurso: { driverId: "uid-ana", paymentMethod: "cash", status: "in_progress", paymentStatus: null },
  pagado: { driverId: "uid-ana", paymentMethod: "cash", status: "paid", paymentStatus: "cash" },
};

async function levantar({ conPagos = true } = {}) {
  const firebase = firebaseSimulado(VIAJES);
  const app = createApp({
    store: createVerificationStore(),
    enviarCorreo: async () => {},
    pagos: conPagos ? crearPagos(firebase) : null,
    logger: { error() {} },
  });
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${app.address().port}/api/v1/pagos/efectivo`;
  const post = async (body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  return { app, post, ...firebase };
}

test("marca pagado en efectivo un viaje completed del conductor", async (t) => {
  const { app, post, escrituras, datos } = await levantar();
  t.after(() => app.close());

  const r = await post({ tripId: "efectivo" }, "token-ana");
  assert.deepEqual(r, { status: 200, body: { ok: true } });
  assert.deepEqual(escrituras, [
    { ruta: "trips/efectivo", cambios: { paymentStatus: "cash", status: "paid" } },
  ]);
  assert.equal(datos.get("efectivo").paymentId, undefined);
});

test("sin token o con un token inválido responde 401 sin leer el viaje", async (t) => {
  const { app, post, escrituras } = await levantar();
  t.after(() => app.close());

  for (const token of [undefined, "token-falso"]) {
    const r = await post({ tripId: "efectivo" }, token);
    assert.equal(r.status, 401);
    assert.equal(r.body.codigoError, "no_autorizado");
  }
  assert.equal(escrituras.length, 0);
});

test("no deja cobrar el viaje de otro conductor", async (t) => {
  const { app, post, escrituras } = await levantar();
  t.after(() => app.close());

  const r = await post({ tripId: "efectivo" }, "token-beto");
  assert.equal(r.status, 403);
  assert.equal(r.body.codigoError, "no_es_tu_viaje");
  assert.equal(escrituras.length, 0);
});

test("rechaza viajes que no son en efectivo o que no están completed", async (t) => {
  const { app, post, escrituras } = await levantar();
  t.after(() => app.close());

  const tarjeta = await post({ tripId: "tarjeta" }, "token-ana");
  assert.equal(tarjeta.status, 409);
  assert.equal(tarjeta.body.codigoError, "metodo_invalido");

  const enCurso = await post({ tripId: "enCurso" }, "token-ana");
  assert.equal(enCurso.status, 409);
  assert.equal(enCurso.body.codigoError, "estado_invalido");

  assert.equal(escrituras.length, 0);
});

test("viaje inexistente o tripId inválido", async (t) => {
  const { app, post } = await levantar();
  t.after(() => app.close());

  const r = await post({ tripId: "no-existe" }, "token-ana");
  assert.equal(r.status, 404);
  assert.equal(r.body.codigoError, "no_encontrado");

  for (const body of [{}, { tripId: "" }, { tripId: 5 }, { tripId: "a/b" }]) {
    const invalido = await post(body, "token-ana");
    assert.equal(invalido.status, 400);
    assert.equal(invalido.body.codigoError, "datos_invalidos");
  }
});

test("si ya estaba pagado en efectivo responde ok sin volver a escribir", async (t) => {
  const { app, post, escrituras } = await levantar();
  t.after(() => app.close());

  assert.deepEqual(await post({ tripId: "pagado" }, "token-ana"), {
    status: 200,
    body: { ok: true },
  });
  // Y un segundo intento sobre el que se acaba de pagar tampoco escribe
  await post({ tripId: "efectivo" }, "token-ana");
  await post({ tripId: "efectivo" }, "token-ana");
  assert.equal(escrituras.length, 1);
});

test("sin firebase-admin configurado responde 503", async (t) => {
  const { app, post } = await levantar({ conPagos: false });
  t.after(() => app.close());

  const r = await post({ tripId: "efectivo" }, "token-ana");
  assert.equal(r.status, 503);
  assert.equal(r.body.codigoError, "pagos_no_configurados");
});

test("lee el token de la cabecera Authorization: Bearer", () => {
  assert.equal(leerToken("Bearer abc.def"), "abc.def");
  assert.equal(leerToken("bearer abc"), "abc");
  assert.equal(leerToken("abc"), null);
  assert.equal(leerToken(undefined), null);
});
