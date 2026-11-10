const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createVerificationStore } = require("../src/verification");

async function levantar({ falla = false } = {}) {
  const enviados = [];
  const app = createApp({
    store: createVerificationStore(),
    enviarCorreo: async (correo) => {
      if (falla) throw new Error("SMTP caído");
      enviados.push(correo);
    },
    logger: { error() {} },
  });
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${app.address().port}/api/v1`;
  const post = async (ruta, body) => {
    const res = await fetch(base + ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };
  return { app, base, post, enviados };
}

test("flujo completo: enviar y verificar el código", async (t) => {
  const { app, post, enviados } = await levantar();
  t.after(() => app.close());

  const r1 = await post("/auth/enviar-codigo", {
    email: "ana@ejemplo.com", nombre: "Ana <b>", motivo: "registro", dispositivo: "Pixel 7",
  });
  assert.equal(r1.status, 200);
  assert.deepEqual(r1.body, { ok: true, minutos: 10 });
  assert.equal(enviados.length, 1);

  const codigo = enviados[0].asunto.slice(0, 6);
  assert.match(codigo, /^\d{6}$/);
  assert.match(enviados[0].asunto, /confirmar tu cuenta/);
  assert.ok(enviados[0].html.includes("Ana &lt;b&gt;"), "escapa el nombre");
  assert.ok(enviados[0].html.includes(codigo));
  assert.ok(!JSON.stringify(r1.body).includes(codigo), "no devuelve el código");

  const r2 = await post("/auth/verificar-codigo", { email: "ana@ejemplo.com", codigo });
  assert.deepEqual(r2, { status: 200, body: { ok: true } });
});

test("el asunto de login es distinto al de registro", async (t) => {
  const { app, post, enviados } = await levantar();
  t.after(() => app.close());
  await post("/auth/enviar-codigo", { email: "a@b.co", motivo: "login" });
  assert.match(enviados[0].asunto, /inicio de sesión/);
});

test("valida el motivo", async (t) => {
  const { app, post } = await levantar();
  t.after(() => app.close());
  const r = await post("/auth/enviar-codigo", { email: "a@b.co", motivo: "otro" });
  assert.equal(r.status, 400);
  assert.equal(r.body.codigoError, "motivo_invalido");
});

test("código incorrecto responde 400", async (t) => {
  const { app, post } = await levantar();
  t.after(() => app.close());
  await post("/auth/enviar-codigo", { email: "a@b.co", motivo: "login" });
  const r = await post("/auth/verificar-codigo", { email: "a@b.co", codigo: "abc" });
  assert.equal(r.status, 400);
  assert.equal(r.body.codigoError, "codigo_invalido");
});

test("si el correo falla responde 502 y deja pedir otro de una", async (t) => {
  const { app, post } = await levantar({ falla: true });
  t.after(() => app.close());
  const r1 = await post("/auth/enviar-codigo", { email: "a@b.co", motivo: "login" });
  assert.equal(r1.status, 502);
  const r2 = await post("/auth/enviar-codigo", { email: "a@b.co", motivo: "login" });
  assert.equal(r2.status, 502, "no lo bloquea la espera de 60 s");
});

test("JSON inválido, rutas y métodos", async (t) => {
  const { app, base } = await levantar();
  t.after(() => app.close());
  const malo = await fetch(base + "/auth/verificar-codigo", { method: "POST", body: "{" });
  assert.equal(malo.status, 400);
  assert.equal((await fetch(base + "/nada")).status, 404);
  assert.equal((await fetch(base + "/auth/enviar-codigo")).status, 405);
  assert.equal((await fetch(base + "/health")).status, 200);
});
