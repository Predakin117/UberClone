// AI-assisted: see docs/AI_LOG.md #62
// Mercado Pago Checkout Pro with fake firebase-admin and a fake Mercado Pago:
// no real request leaves the tests.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createMercadoPago } = require("../src/mercadoPago");
const { createMercadoPagoPayments, paymentChanges } = require("../src/pagos");
const { createVerificationStore } = require("../src/verification");

// Fake firebase-admin: one token per driver and the trips in memory
function fakeFirebase(trips) {
  const data = new Map(Object.entries(structuredClone(trips)));
  const writes = [];
  const tokens = { "token-ana": "uid-ana", "token-beto": "uid-beto" };
  const auth = {
    async verifyIdToken(token) {
      if (!tokens[token]) throw new Error("auth/argument-error");
      return { uid: tokens[token] };
    },
  };
  const db = {
    collection: (name) => ({ doc: (id) => ({ path: `${name}/${id}`, id }) }),
    async runTransaction(fn) {
      return fn({
        async get(ref) {
          const trip = data.get(ref.id);
          return { exists: trip !== undefined, data: () => structuredClone(trip) };
        },
        update(ref, changes) {
          writes.push({ path: ref.path, changes });
          data.set(ref.id, { ...data.get(ref.id), ...changes });
        },
      });
    },
  };
  return { auth, db, data, writes };
}

// fare 19.200 + tip 2.000: the passenger pays 21.200
const TRIPS = {
  card: {
    driverId: "uid-ana",
    paymentMethod: "mercadopago",
    status: "completed",
    fare: 19200,
    tip: 2000,
    paymentStatus: null,
  },
  cash: { driverId: "uid-ana", paymentMethod: "cash", status: "completed", fare: 19200, tip: 0 },
  riding: { driverId: "uid-ana", paymentMethod: "mercadopago", status: "in_progress", fare: 19200, tip: 0 },
  paid: { driverId: "uid-ana", paymentMethod: "mercadopago", status: "paid", fare: 19200, tip: 0, paymentStatus: "approved" },
};

const payment = (overrides = {}) => ({
  id: 555,
  status: "approved",
  external_reference: "card",
  transaction_amount: 21200,
  currency_id: "COP",
  ...overrides,
});

// Fake Mercado Pago: the payments it knows and the preferences it created
function fakeMercadoPago(payments = [payment()]) {
  const preferences = [];
  return {
    preferences,
    async createPreference(preference) {
      preferences.push(preference);
      return { preferenceId: "pref-1", url: "https://mp.test/checkout/pref-1" };
    },
    async getPayment(id) {
      const found = payments.find((item) => String(item.id) === String(id));
      if (!found) throw new Error("not found");
      return found;
    },
    async findTripPayments(tripId) {
      return payments.filter((item) => item.external_reference === tripId);
    },
  };
}

async function start({ payments, withMercadoPago = true } = {}) {
  const firebase = fakeFirebase(TRIPS);
  const mp = fakeMercadoPago(payments);
  const app = createApp({
    store: createVerificationStore(),
    enviarCorreo: async () => {},
    mercadoPago: withMercadoPago
      ? createMercadoPagoPayments({ ...firebase, mercadoPago: mp, logger: { error() {} } })
      : null,
    logger: { error() {} },
  });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.address().port}/api/v1/pagos/mercadopago`;
  const post = async (path, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };
  return { app, post, base, mp, ...firebase };
}

test("creates the checkout of a finished trip with the amount it charges", async (t) => {
  const { app, post, mp, writes } = await start();
  t.after(() => app.close());

  const r = await post("", { tripId: "card", amount: 21200 }, "token-ana");
  assert.deepEqual(r, {
    status: 200,
    body: { ok: true, url: "https://mp.test/checkout/pref-1", split: false },
  });
  assert.deepEqual(mp.preferences, [
    { tripId: "card", amount: 21200, title: "Viaje UberClone" },
  ]);
  assert.deepEqual(writes, []);
});

test("rejects a wrong amount, another driver, a cash trip and an unfinished one", async (t) => {
  const { app, post, mp } = await start();
  t.after(() => app.close());

  const cases = [
    [{ tripId: "card", amount: 100 }, "token-ana", 409, "monto_invalido"],
    [{ tripId: "card", amount: 21200 }, "token-beto", 403, "no_es_tu_viaje"],
    [{ tripId: "cash", amount: 19200 }, "token-ana", 409, "metodo_invalido"],
    [{ tripId: "riding", amount: 19200 }, "token-ana", 409, "estado_invalido"],
    [{ tripId: "paid", amount: 19200 }, "token-ana", 409, "ya_pagado"],
    [{ tripId: "nope", amount: 1 }, "token-ana", 404, "no_encontrado"],
    [{ tripId: "a/b", amount: 1 }, "token-ana", 400, "datos_invalidos"],
    [{ tripId: "card", amount: 21200 }, "token-falso", 401, "no_autorizado"],
  ];
  for (const [body, token, status, codigoError] of cases) {
    const r = await post("", body, token);
    assert.equal(r.status, status, codigoError);
    assert.equal(r.body.codigoError, codigoError);
  }
  assert.equal(mp.preferences.length, 0);
});

test("the webhook reads the payment from Mercado Pago and marks the trip paid", async (t) => {
  const { app, post, writes, data } = await start();
  t.after(() => app.close());

  const r = await post("/webhook", { type: "payment", data: { id: "555" } });
  assert.deepEqual(r, { status: 200, body: { ok: true } });
  assert.deepEqual(writes, [
    {
      path: "trips/card",
      changes: { paymentStatus: "approved", paymentId: "555", status: "paid" },
    },
  ]);
  assert.equal(data.get("card").status, "paid");

  // The same notification again writes nothing
  await post("/webhook", { type: "payment", data: { id: "555" } });
  assert.equal(writes.length, 1);
});

test("a fake notification cannot mark a trip paid", async (t) => {
  const { app, post, writes } = await start({ payments: [] });
  t.after(() => app.close());

  // The payment does not exist in Mercado Pago: error 500 and nothing written
  const fake = await post("/webhook", {
    type: "payment",
    data: { id: "999", status: "approved", external_reference: "card" },
  });
  assert.equal(fake.status, 500);
  // Other notifications are answered and ignored
  const other = await post("/webhook", { type: "merchant_order", data: { id: "1" } });
  assert.deepEqual(other, { status: 200, body: { ok: true } });
  assert.deepEqual(writes, []);
});

test("checking the trip saves a rejected payment, and later an approved one", async (t) => {
  const payments = [payment({ id: 1, status: "rejected" })];
  const { app, post, data } = await start({ payments });
  t.after(() => app.close());

  let r = await post("/verificar", { tripId: "card" }, "token-ana");
  assert.deepEqual(r.body, { ok: true, paymentStatus: "rejected" });
  assert.equal(data.get("card").status, "completed");

  payments.unshift(payment({ id: 2 }));
  r = await post("/verificar", { tripId: "card" }, "token-ana");
  assert.deepEqual(r.body, { ok: true, paymentStatus: "approved" });
  assert.equal(data.get("card").status, "paid");
  assert.equal(data.get("card").paymentId, "2");
});

test("the return page saves the payment and asks to go back to the app", async (t) => {
  const { app, base, data } = await start();
  t.after(() => app.close());

  const res = await fetch(`${base}/retorno?payment_id=555&status=approved`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  assert.match(await res.text(), /Pago aprobado/);
  assert.equal(data.get("card").status, "paid");
});

test("without Mercado Pago configured the routes answer 503", async (t) => {
  const { app, post } = await start({ withMercadoPago: false });
  t.after(() => app.close());

  const r = await post("", { tripId: "card", amount: 21200 }, "token-ana");
  assert.equal(r.status, 503);
  assert.equal(r.body.codigoError, "pagos_no_configurados");
});

test("paymentChanges only marks paid an approved payment for the right amount", () => {
  const trip = TRIPS.card;
  assert.deepEqual(paymentChanges(trip, payment()), {
    paymentStatus: "approved",
    paymentId: "555",
    status: "paid",
  });
  assert.equal(paymentChanges(trip, payment({ transaction_amount: 100 })), null);
  assert.equal(paymentChanges(trip, payment({ currency_id: "USD" })), null);
  assert.deepEqual(paymentChanges(trip, payment({ status: "in_process" })), {
    paymentStatus: "pending",
    paymentId: "555",
  });
  assert.equal(paymentChanges(trip, payment({ status: "refunded" })), null);
  assert.equal(paymentChanges(TRIPS.cash, payment()), null);
  assert.equal(paymentChanges(TRIPS.paid, payment()), null);
});

test("the client sends the preference with the token, webhook and return page", async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ id: "pref-1", init_point: "https://mp/checkout" }) };
  };
  const withTunnel = createMercadoPago({
    accessToken: "APP_USR-test",
    publicUrl: "https://abc.trycloudflare.com/",
    fetchFn,
  });
  const result = await withTunnel.createPreference({ tripId: "t1", amount: 21200, title: "Viaje" });
  assert.deepEqual(result, { preferenceId: "pref-1", url: "https://mp/checkout" });

  const [call] = calls;
  assert.equal(call.url, "https://api.mercadopago.com/checkout/preferences");
  assert.equal(call.options.headers.Authorization, "Bearer APP_USR-test");
  const sent = JSON.parse(call.options.body);
  assert.equal(sent.external_reference, "t1");
  assert.deepEqual(sent.items[0], {
    id: "t1",
    title: "Viaje",
    quantity: 1,
    currency_id: "COP",
    unit_price: 21200,
  });
  assert.equal(
    sent.notification_url,
    "https://abc.trycloudflare.com/api/v1/pagos/mercadopago/webhook",
  );
  assert.equal(sent.auto_return, "approved");

  // Without the tunnel: no webhook nor return page
  const local = createMercadoPago({ accessToken: "APP_USR-test", fetchFn });
  await local.createPreference({ tripId: "t2", amount: 6000, title: "Viaje" });
  const localSent = JSON.parse(calls[1].options.body);
  assert.equal(localSent.notification_url, undefined);
  assert.equal(localSent.back_urls, undefined);
});

test("an error answer of Mercado Pago becomes an exception", async () => {
  const fetchFn = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: "invalid access token" }),
  });
  const mp = createMercadoPago({ accessToken: "bad", fetchFn });
  await assert.rejects(mp.getPayment("1"), { message: "invalid access token", status: 401 });
});
