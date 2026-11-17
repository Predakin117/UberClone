// AI-assisted: see docs/AI_LOG.md #63
// Split payments (optional bonus of section 4) with fake firebase-admin and a
// fake Mercado Pago: no real request leaves the tests.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createMercadoPagoOAuth } = require("../src/mercadoPagoOAuth");
const { createMercadoPagoPayments, paymentChanges } = require("../src/pagos");
const { createSellerAccounts } = require("../src/sellerAccounts");
const { createVerificationStore } = require("../src/verification");

const DAY = 24 * 60 * 60 * 1000;

// Fake Firestore with documents by path, for transactions and direct reads
function fakeDb(initial = {}) {
  const docs = new Map(Object.entries(structuredClone(initial)));
  const writes = [];
  const ref = (path) => ({
    path,
    async get() {
      const value = docs.get(path);
      return { exists: value !== undefined, data: () => structuredClone(value) };
    },
    async set(value) {
      docs.set(path, structuredClone(value));
    },
    async delete() {
      docs.delete(path);
    },
  });
  return {
    docs,
    writes,
    collection: (name) => ({ doc: (id) => ref(`${name}/${id}`) }),
    async runTransaction(fn) {
      return fn({
        get: (docRef) => docRef.get(),
        update(docRef, changes) {
          writes.push({ path: docRef.path, changes });
          docs.set(docRef.path, { ...docs.get(docRef.path), ...changes });
        },
      });
    },
  };
}

const auth = {
  async verifyIdToken(token) {
    const uids = { "token-ana": "uid-ana", "token-beto": "uid-beto" };
    if (!uids[token]) throw new Error("auth/argument-error");
    return { uid: uids[token] };
  },
};

// fare 19.200, commission 3.840, tip 2.000: the passenger pays 21.200
const TRIP = {
  driverId: "uid-ana",
  paymentMethod: "mercadopago",
  status: "completed",
  fare: 19200,
  commission: 3840,
  tip: 2000,
};

const approved = (overrides = {}) => ({
  id: 777,
  status: "approved",
  external_reference: "card",
  transaction_amount: 21200,
  currency_id: "COP",
  date_created: "2026-11-16T10:00:00.000-05:00",
  ...overrides,
});

// Fake Mercado Pago client: the payments of one account
function fakeClient(name, payments = []) {
  const preferences = [];
  return {
    name,
    preferences,
    async createPreference(preference) {
      preferences.push(preference);
      return { url: `https://mp.test/${name}` };
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

// Fake OAuth: any code gives the driver's tokens
function fakeOAuth() {
  return {
    refreshed: 0,
    authorizationUrl: (state) => `https://auth.mp.test/authorization?state=${state}`,
    async exchangeCode(code) {
      if (code !== "good-code") throw Object.assign(new Error("invalid_grant"), { status: 400 });
      return {
        accessToken: "APP_USR-ana",
        refreshToken: "refresh-ana",
        userId: "111",
        publicKey: "pk",
        expiresAt: Date.now() + 180 * DAY,
      };
    },
    async refresh() {
      this.refreshed += 1;
      return { accessToken: "APP_USR-ana-2", refreshToken: "refresh-2", expiresAt: Date.now() + 180 * DAY };
    },
  };
}

async function start({ linked = true, sellerPayments = [], platformPayments = [], withSplit = true } = {}) {
  const db = fakeDb({ "trips/card": TRIP });
  const oauth = fakeOAuth();
  let states = 0;
  const sellers = createSellerAccounts({
    db,
    oauth,
    newState: () => `state-${++states}`,
    logger: { error() {} },
  });
  if (linked) {
    await db.collection("mercadoPagoAccounts").doc("uid-ana").set({
      accessToken: "APP_USR-ana",
      refreshToken: "refresh-ana",
      userId: "111",
      expiresAt: Date.now() + 180 * DAY,
    });
  }
  const platform = fakeClient("platform", platformPayments);
  const seller = fakeClient("seller", sellerPayments);
  const tokensUsed = [];
  const app = createApp({
    store: createVerificationStore(),
    enviarCorreo: async () => {},
    mercadoPago: createMercadoPagoPayments({
      auth,
      db,
      mercadoPago: platform,
      sellers: withSplit ? sellers : null,
      clientFor: withSplit
        ? (token) => {
            tokensUsed.push(token);
            return seller;
          }
        : null,
      logger: { error() {} },
    }),
    logger: { error() {} },
  });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.address().port}/api/v1/pagos/mercadopago`;
  const post = async (path, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  return { app, post, base, db, platform, seller, tokensUsed, oauth };
}

test("a linked driver's trip is charged in their account with the commission for the platform", async (t) => {
  const { app, post, platform, seller, tokensUsed } = await start();
  t.after(() => app.close());

  const r = await post("", { tripId: "card", amount: 21200 }, "token-ana");
  assert.deepEqual(r.body, { ok: true, url: "https://mp.test/seller", split: true });
  assert.deepEqual(tokensUsed, ["APP_USR-ana"]);
  assert.deepEqual(seller.preferences, [
    {
      tripId: "card",
      amount: 21200,
      title: "Viaje UberClone",
      marketplaceFee: 3840,
      notificationParams: { driver: "uid-ana" },
    },
  ]);
  assert.equal(platform.preferences.length, 0);
});

test("without a linked account the platform charges the whole trip", async (t) => {
  const { app, post, platform, seller } = await start({ linked: false });
  t.after(() => app.close());

  const r = await post("", { tripId: "card", amount: 21200 }, "token-ana");
  assert.deepEqual(r.body, { ok: true, url: "https://mp.test/platform", split: false });
  assert.equal(platform.preferences.length, 1);
  assert.equal(seller.preferences.length, 0);
});

test("the webhook of a split payment reads it with the driver's token and marks it split", async (t) => {
  const { app, post, db } = await start({ sellerPayments: [approved()] });
  t.after(() => app.close());

  const res = await post("/webhook?driver=uid-ana", { type: "payment", data: { id: "777" } });
  assert.deepEqual(res, { status: 200, body: { ok: true } });
  assert.deepEqual(db.writes, [
    {
      path: "trips/card",
      changes: { paymentStatus: "approved", paymentId: "777", status: "paid", paymentSplit: true },
    },
  ]);
});

test("a split notification for another driver's trip changes nothing", async (t) => {
  const { app, post, db } = await start({ sellerPayments: [approved()] });
  t.after(() => app.close());

  // beto has no linked account: the payment is read with the platform token,
  // where it does not exist
  const res = await post("/webhook?driver=uid-beto", { type: "payment", data: { id: "777" } });
  assert.equal(res.status, 500);
  assert.deepEqual(db.writes, []);
});

test("checking the trip finds the approved payment in the driver's account", async (t) => {
  const { app, post, db } = await start({
    sellerPayments: [approved()],
    platformPayments: [approved({ id: 1, status: "rejected", date_created: "2026-11-16T09:00:00.000-05:00" })],
  });
  t.after(() => app.close());

  const r = await post("/verificar", { tripId: "card" }, "token-ana");
  assert.deepEqual(r.body, { ok: true, paymentStatus: "approved" });
  assert.equal(db.docs.get("trips/card").paymentSplit, true);
  assert.equal(db.docs.get("trips/card").paymentId, "777");
});

test("the driver links and unlinks the account", async (t) => {
  const { app, post, base, db } = await start({ linked: false });
  t.after(() => app.close());

  let r = await post("/vinculo", {}, "token-ana");
  assert.deepEqual(r.body, { ok: true, available: true, linked: false });

  r = await post("/vincular", {}, "token-ana");
  assert.deepEqual(r.body, { ok: true, url: "https://auth.mp.test/authorization?state=state-1" });

  // Mercado Pago comes back with the code and the state
  const page = await fetch(`${base}/oauth?code=good-code&state=state-1`);
  assert.match(await page.text(), /Cuenta vinculada/);
  assert.equal(db.docs.get("mercadoPagoAccounts/uid-ana").accessToken, "APP_USR-ana");

  // The same state does not work twice
  const again = await fetch(`${base}/oauth?code=good-code&state=state-1`);
  assert.match(await again.text(), /El enlace venció/);

  r = await post("/vinculo", {}, "token-ana");
  assert.deepEqual(r.body, { ok: true, available: true, linked: true });

  r = await post("/desvincular", {}, "token-ana");
  assert.deepEqual(r.body, { ok: true });
  assert.equal(db.docs.has("mercadoPagoAccounts/uid-ana"), false);
});

test("a refused or failed link shows the error page and saves nothing", async (t) => {
  const { app, post, base, db } = await start({ linked: false });
  t.after(() => app.close());

  await post("/vincular", {}, "token-ana");
  const refused = await fetch(`${base}/oauth?error=access_denied&state=state-1`);
  assert.match(await refused.text(), /No se vinculó la cuenta/);
  const badCode = await fetch(`${base}/oauth?code=bad&state=state-1`);
  assert.match(await badCode.text(), /No se vinculó la cuenta/);
  assert.equal(db.docs.has("mercadoPagoAccounts/uid-ana"), false);
});

test("without MP_CLIENT_ID the link is not available", async (t) => {
  const { app, post } = await start({ withSplit: false });
  t.after(() => app.close());

  let r = await post("/vinculo", {}, "token-ana");
  assert.deepEqual(r.body, { ok: true, available: false, linked: false });
  r = await post("/vincular", {}, "token-ana");
  assert.equal(r.status, 503);
  assert.equal(r.body.codigoError, "vinculo_no_configurado");
  r = await post("/vinculo", {}, "token-falso");
  assert.equal(r.status, 401);
});

test("the access token is renewed when it is about to expire", async () => {
  const db = fakeDb({
    "mercadoPagoAccounts/uid-ana": {
      accessToken: "old",
      refreshToken: "refresh-ana",
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    },
  });
  const oauth = fakeOAuth();
  const sellers = createSellerAccounts({ db, oauth, logger: { error() {} } });

  assert.equal(await sellers.accessTokenFor("uid-ana"), "APP_USR-ana-2");
  assert.equal(oauth.refreshed, 1);
  assert.equal(db.docs.get("mercadoPagoAccounts/uid-ana").refreshToken, "refresh-2");
  assert.equal(await sellers.accessTokenFor("nobody"), null);
});

test("a rejected refresh removes the link; a network error keeps the old token", async () => {
  const soon = Date.now() + 60 * 60 * 1000;
  for (const [status, expected, kept] of [
    [400, null, false],
    [undefined, "old", true],
  ]) {
    const db = fakeDb({
      "mercadoPagoAccounts/uid-ana": { accessToken: "old", refreshToken: "r", expiresAt: soon },
    });
    const oauth = {
      async refresh() {
        throw Object.assign(new Error("refresh failed"), { status });
      },
    };
    const sellers = createSellerAccounts({ db, oauth, logger: { error() {} } });
    assert.equal(await sellers.accessTokenFor("uid-ana"), expected);
    assert.equal(db.docs.has("mercadoPagoAccounts/uid-ana"), kept);
  }
});

test("paymentChanges marks paymentSplit only on an approved split payment", () => {
  assert.deepEqual(paymentChanges(TRIP, approved(), { split: true }), {
    paymentStatus: "approved",
    paymentId: "777",
    status: "paid",
    paymentSplit: true,
  });
  assert.deepEqual(paymentChanges(TRIP, approved({ status: "rejected" }), { split: true }), {
    paymentStatus: "rejected",
    paymentId: "777",
  });
  assert.equal(paymentChanges(TRIP, approved()).paymentSplit, undefined);
});

test("the split preference carries the marketplace fee and the driver in the webhook", async () => {
  const { createMercadoPago } = require("../src/mercadoPago");
  let sent = null;
  let auth = null;
  const client = createMercadoPago({
    accessToken: "APP_USR-ana",
    publicUrl: "https://abc.trycloudflare.com",
    fetchFn: async (url, options) => {
      sent = JSON.parse(options.body);
      auth = options.headers.Authorization;
      return { ok: true, json: async () => ({ id: "p", init_point: "https://mp/c" }) };
    },
  });
  await client.createPreference({
    tripId: "card",
    amount: 21200,
    title: "Viaje",
    marketplaceFee: 3840,
    notificationParams: { driver: "uid-ana" },
  });
  assert.equal(auth, "Bearer APP_USR-ana");
  assert.equal(sent.marketplace_fee, 3840);
  assert.equal(
    sent.notification_url,
    "https://abc.trycloudflare.com/api/v1/pagos/mercadopago/webhook?driver=uid-ana",
  );
});

test("the OAuth client builds the authorization page and changes the code", async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return {
      ok: true,
      json: async () => ({
        access_token: "APP_USR-x",
        refresh_token: "r-x",
        user_id: 42,
        public_key: "pk",
        expires_in: 15552000,
      }),
    };
  };
  const oauth = createMercadoPagoOAuth({
    clientId: "123",
    clientSecret: "secret",
    redirectUri: "https://abc.trycloudflare.com/api/v1/pagos/mercadopago/oauth",
    fetchFn,
    now: () => 1000,
  });

  const page = new URL(oauth.authorizationUrl("state-1"));
  assert.equal(page.origin + page.pathname, "https://auth.mercadopago.com/authorization");
  assert.deepEqual(Object.fromEntries(page.searchParams), {
    client_id: "123",
    response_type: "code",
    platform_id: "mp",
    state: "state-1",
    redirect_uri: "https://abc.trycloudflare.com/api/v1/pagos/mercadopago/oauth",
  });

  const account = await oauth.exchangeCode("code-1");
  assert.deepEqual(account, {
    accessToken: "APP_USR-x",
    refreshToken: "r-x",
    userId: "42",
    publicKey: "pk",
    expiresAt: 1000 + 15552000 * 1000,
  });
  assert.equal(calls[0].url, "https://api.mercadopago.com/oauth/token");
  assert.deepEqual(calls[0].body, {
    client_id: "123",
    client_secret: "secret",
    grant_type: "authorization_code",
    code: "code-1",
    redirect_uri: "https://abc.trycloudflare.com/api/v1/pagos/mercadopago/oauth",
  });

  await oauth.refresh("r-x");
  assert.deepEqual(calls[1].body, {
    client_id: "123",
    client_secret: "secret",
    grant_type: "refresh_token",
    refresh_token: "r-x",
  });
});
