const test = require("node:test");
const assert = require("node:assert/strict");
const { createVerificationStore } = require("../src/verification");

const crearStore = (opciones = {}) => {
  let ahora = 1_000_000;
  const store = createVerificationStore({ now: () => ahora, ...opciones });
  return { store, avanzar: (ms) => (ahora += ms) };
};

test("emite un código de 6 dígitos y lo acepta una sola vez", () => {
  const { store } = crearStore();
  const { ok, codigo } = store.emitir("Ana@Ejemplo.com ");
  assert.equal(ok, true);
  assert.match(codigo, /^\d{6}$/);
  assert.deepEqual(store.verificar("ana@ejemplo.com", codigo), { ok: true, email: "ana@ejemplo.com" });
  assert.equal(store.verificar("ana@ejemplo.com", codigo).codigoError, "sin_codigo");
});

test("rechaza correos inválidos", () => {
  const { store } = crearStore();
  assert.equal(store.emitir("no-es-correo").codigoError, "email_invalido");
  assert.equal(store.emitir(undefined).codigoError, "email_invalido");
});

test("rechaza códigos con formato inválido sin gastar intentos", () => {
  const { store } = crearStore();
  store.emitir("a@b.co");
  assert.equal(store.verificar("a@b.co", "12ab").codigoError, "codigo_invalido");
});

test("el código vence", () => {
  const { store, avanzar } = crearStore({ ttlMinutes: 10 });
  const { codigo } = store.emitir("a@b.co");
  avanzar(10 * 60_000 + 1);
  assert.equal(store.verificar("a@b.co", codigo).codigoError, "vencido");
});

test("bloquea después de 5 intentos fallidos", () => {
  const { store } = crearStore({ maxAttempts: 5 });
  const { codigo } = store.emitir("a@b.co");
  const malo = codigo === "000000" ? "111111" : "000000";
  for (let i = 0; i < 4; i++) {
    assert.equal(store.verificar("a@b.co", malo).codigoError, "codigo_incorrecto");
  }
  assert.equal(store.verificar("a@b.co", malo).codigoError, "demasiados_intentos");
  assert.equal(store.verificar("a@b.co", codigo).codigoError, "sin_codigo");
});

test("no deja pedir otro código antes de 60 segundos", () => {
  const { store, avanzar } = crearStore({ cooldownSeconds: 60 });
  store.emitir("a@b.co");
  const r = store.emitir("a@b.co");
  assert.equal(r.codigoError, "espera");
  assert.equal(r.reintentarEn, 60);
  avanzar(60_000);
  assert.equal(store.emitir("a@b.co").ok, true);
});

test("un código nuevo reemplaza al anterior", () => {
  const { store, avanzar } = crearStore();
  const viejo = store.emitir("a@b.co").codigo;
  avanzar(61_000);
  const nuevo = store.emitir("a@b.co").codigo;
  if (viejo !== nuevo) {
    assert.equal(store.verificar("a@b.co", viejo).codigoError, "codigo_incorrecto");
  }
  assert.equal(store.verificar("a@b.co", nuevo).ok, true);
});
