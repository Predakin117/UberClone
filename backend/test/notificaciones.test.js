// AI-assisted: see docs/AI_LOG.md #32
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  armarMensaje,
  crearNotificaciones,
  debeRecibirla,
  VENTANA_DE_UBICACION_MS,
} = require("../src/notificaciones");
const { avisarConductores } = require("../scripts/simular-solicitud");

const AHORA = Date.parse("2026-11-17T15:00:00Z");
// Timestamp de Firestore simulado: solo hace falta toMillis
const haceMinutos = (minutos) => ({ toMillis: () => AHORA - minutos * 60_000 });
const BORRAR = Symbol("FieldValue.delete");

// firebase-admin simulado: Firestore con los conductores en memoria (la consulta
// aplica los dos where de igualdad) y Messaging que anota cada envío. Los
// tokens de errores fallan con ese error de FCM.
function firebaseSimulado(conductores, errores = {}) {
  // Copia por conductor (structuredClone no copia el toMillis de los Timestamp)
  const datos = new Map(
    Object.entries(conductores).map(([uid, conductor]) => [uid, { ...conductor }]),
  );
  const enviados = [];
  const escrituras = [];
  const consulta = (filtros) => ({
    where: (campo, operador, valor) => consulta([...filtros, [campo, valor]]),
    async get() {
      const docs = [...datos.entries()]
        .filter(([, conductor]) => filtros.every(([campo, valor]) => conductor[campo] === valor))
        .map(([id, conductor]) => ({ id, data: () => conductor }));
      return { docs };
    },
  });
  const db = {
    collection: () => ({ ...consulta([]), doc: (id) => ({ id }) }),
    async runTransaction(fn) {
      return fn({
        async get(referencia) {
          const conductor = datos.get(referencia.id);
          return { exists: conductor !== undefined, data: () => conductor };
        },
        update(referencia, cambios) {
          escrituras.push({ uid: referencia.id, cambios });
          const conductor = { ...datos.get(referencia.id) };
          for (const [campo, valor] of Object.entries(cambios)) {
            if (valor === BORRAR) delete conductor[campo];
            else conductor[campo] = valor;
          }
          datos.set(referencia.id, conductor);
        },
      });
    },
  };
  const messaging = {
    async send(mensaje) {
      enviados.push(mensaje);
      const codigo = errores[mensaje.token];
      if (codigo) throw Object.assign(new Error(codigo), { code: codigo });
      return `mensaje-${enviados.length}`;
    },
  };
  const notificaciones = crearNotificaciones({
    db,
    messaging,
    FieldValue: { delete: () => BORRAR },
    logger: { warn() {} },
    ahora: () => AHORA,
  });
  return { notificaciones, datos, enviados, escrituras };
}

const disponible = (extra = {}) => ({
  status: "approved",
  isAvailable: true,
  fcmToken: "token-ana",
  locationUpdatedAt: haceMinutos(1),
  notificationLanguage: "es",
  ...extra,
});

const VIAJE = {
  id: "viaje-1",
  origin: { address: "Plaza Botero, La Candelaria, Medellín" },
  status: "requested",
};

test("notifica a los conductores aprobados, disponibles, con token y ubicación reciente", async () => {
  const { notificaciones, enviados } = firebaseSimulado({
    ana: disponible(),
    beto: disponible({ fcmToken: "token-beto", notificationLanguage: "en" }),
    pendiente: disponible({ status: "pending", fcmToken: "token-pendiente" }),
    desconectado: disponible({ isAvailable: false, fcmToken: "token-desconectado" }),
    sinToken: disponible({ fcmToken: undefined }),
    viejo: disponible({ fcmToken: "token-viejo", locationUpdatedAt: haceMinutos(11) }),
    sinUbicacion: disponible({ fcmToken: "token-sin-ubicacion", locationUpdatedAt: null }),
  });

  const resumen = await notificaciones.notificarNuevaSolicitud(VIAJE);
  assert.deepEqual(resumen, { enviadas: 2, fallidas: 0, tokensBorrados: 0 });
  assert.deepEqual(
    enviados.map((mensaje) => mensaje.token).sort(),
    ["token-ana", "token-beto"],
  );
});

test("el mensaje lleva el tripId en data, el canal de Android y el idioma del conductor", () => {
  const mensaje = armarMensaje("token-ana", VIAJE, "es");
  assert.deepEqual(mensaje, {
    token: "token-ana",
    notification: {
      title: "Nueva solicitud de viaje",
      body: "Recogida: Plaza Botero, La Candelaria, Medellín",
    },
    data: { type: "trip_request", tripId: "viaje-1" },
    android: { priority: "high", notification: { channelId: "trip-requests" } },
  });
  assert.equal(armarMensaje("t", VIAJE, "en").notification.title, "New trip request");
  // Idioma desconocido o sin dirección: español y un texto genérico
  assert.deepEqual(armarMensaje("t", { id: "v2" }, "fr").notification, {
    title: "Nueva solicitud de viaje",
    body: "Abre la app para verla.",
  });
});

test("la ubicación puede tener hasta 10 minutos (la app en segundo plano)", () => {
  const conductor = disponible();
  assert.equal(debeRecibirla(conductor, AHORA), true);
  assert.equal(
    debeRecibirla({ ...conductor, locationUpdatedAt: haceMinutos(10) }, AHORA),
    true,
  );
  assert.equal(
    debeRecibirla(conductor, AHORA + VENTANA_DE_UBICACION_MS + 60_001),
    false,
  );
  assert.equal(
    debeRecibirla({ ...conductor, locationUpdatedAt: new Date(AHORA) }, AHORA),
    true,
  );
});

test("borra un token que FCM ya no reconoce y sigue con los demás", async () => {
  const { notificaciones, datos, escrituras } = firebaseSimulado(
    {
      ana: disponible(),
      beto: disponible({ fcmToken: "token-beto" }),
    },
    { "token-ana": "messaging/registration-token-not-registered" },
  );

  const resumen = await notificaciones.notificarNuevaSolicitud(VIAJE);
  assert.deepEqual(resumen, { enviadas: 1, fallidas: 1, tokensBorrados: 1 });
  assert.deepEqual(escrituras.map((e) => e.uid), ["ana"]);
  assert.equal(datos.get("ana").fcmToken, undefined);
  assert.equal(datos.get("ana").fcmTokenUpdatedAt, undefined);
  assert.equal(datos.get("beto").fcmToken, "token-beto");
});

test("otros errores de FCM no borran el token", async () => {
  const { notificaciones, escrituras } = firebaseSimulado(
    { ana: disponible() },
    { "token-ana": "messaging/internal-error" },
  );

  const resumen = await notificaciones.notificarNuevaSolicitud(VIAJE);
  assert.deepEqual(resumen, { enviadas: 0, fallidas: 1, tokensBorrados: 0 });
  assert.equal(escrituras.length, 0);
});

test("sin conductores para notificar no envía nada", async () => {
  const { notificaciones, enviados } = firebaseSimulado({
    pendiente: disponible({ status: "pending" }),
  });
  assert.deepEqual(await notificaciones.notificarNuevaSolicitud(VIAJE), {
    enviadas: 0,
    fallidas: 0,
    tokensBorrados: 0,
  });
  assert.equal(enviados.length, 0);
});

test("el simulador sigue aunque falle el envío de notificaciones", async (t) => {
  const avisos = [];
  t.mock.method(console, "warn", (mensaje) => avisos.push(mensaje));
  t.mock.method(console, "log", () => {});

  const crearQueFalla = () => ({
    notificarNuevaSolicitud: async () => {
      throw new Error("sin conexión con FCM");
    },
  });
  await assert.doesNotReject(avisarConductores({}, VIAJE, crearQueFalla));
  assert.match(avisos[0], /No se enviaron notificaciones \(sin conexión con FCM\)/);
});
