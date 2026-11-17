// AI-assisted: see docs/AI_LOG.md #32
// Notificaciones push de solicitudes nuevas (docs/APIS.md, servicio 10), con
// Firebase Cloud Messaging desde firebase-admin. Es el único archivo del
// backend que envía notificaciones. Se usa en el plan Spark, sin Cloud
// Functions: quien crea la solicitud (hoy el simulador) llama a
// notificarNuevaSolicitud.
//
// A quién se notifica: lo mismo que deja ver solicitudes en la app
// (src/services/tripRequestsSource.js y las reglas de trips), un conductor
// "approved" y disponible (isAvailable), que además tenga fcmToken. Como en
// segundo plano Android deja de dar ubicaciones, se acepta una ubicación de
// hasta 10 minutos (no el minuto de docs/APIS.md): así llega a quien tiene la
// app en segundo plano, pero no a quien la cerró a la fuerza hace rato y quedó
// con isAvailable en true.

// Mismo id del canal que crea la app (src/services/pushNotifications.js)
const CANAL_ANDROID = "trip-requests";
// data.type que la app reconoce al tocar la notificación
const TIPO_SOLICITUD = "trip_request";
const VENTANA_DE_UBICACION_MS = 10 * 60 * 1000;
// FCM ya no reconoce el token: la app se desinstaló o el token cambió
const TOKEN_NO_REGISTRADO = "messaging/registration-token-not-registered";

// El texto lo muestra Android sin pasar por la app: va en el idioma que la app
// guardó con el token (notificationLanguage), o en español
const TEXTOS = {
  es: {
    titulo: "Nueva solicitud de viaje",
    cuerpo: (direccion) => (direccion ? `Recogida: ${direccion}` : "Abre la app para verla."),
  },
  en: {
    titulo: "New trip request",
    cuerpo: (direccion) => (direccion ? `Pickup: ${direccion}` : "Open the app to see it."),
  },
};

// Hora de un Timestamp de Firestore (o un Date) en ms, o null
function enMilisegundos(valor) {
  if (typeof valor?.toMillis === "function") return valor.toMillis();
  if (valor instanceof Date) return valor.getTime();
  return null;
}

/**
 * Si el conductor (datos de drivers/{uid}) debe recibir la notificación de
 * una solicitud nueva a la hora ahoraMs.
 */
function debeRecibirla(conductor, ahoraMs) {
  const ubicacionMs = enMilisegundos(conductor.locationUpdatedAt);
  return (
    conductor.status === "approved" &&
    conductor.isAvailable === true &&
    typeof conductor.fcmToken === "string" &&
    conductor.fcmToken !== "" &&
    ubicacionMs !== null &&
    ahoraMs - ubicacionMs <= VENTANA_DE_UBICACION_MS
  );
}

/**
 * Mensaje de FCM para un token: título y texto en el idioma del conductor, y
 * en data (siempre texto) el tipo y el tripId para abrir la solicitud al tocarla.
 */
function armarMensaje(token, viaje, idioma) {
  const textos = TEXTOS[idioma] ?? TEXTOS.es;
  return {
    token,
    notification: {
      title: textos.titulo,
      body: textos.cuerpo(viaje.origin?.address),
    },
    data: { type: TIPO_SOLICITUD, tripId: String(viaje.id) },
    android: {
      priority: "high",
      notification: { channelId: CANAL_ANDROID },
    },
  };
}

/**
 * db y messaging son los de firebase-admin (getFirestore y getMessaging), y
 * FieldValue el de firebase-admin/firestore; las pruebas pasan unos simulados.
 */
function crearNotificaciones({ db, messaging, FieldValue, logger = console, ahora = Date.now }) {
  // Conductores aprobados y disponibles: dos filtros de igualdad, que Firestore
  // resuelve sin índice compuesto. El resto se revisa en memoria.
  async function conductoresParaNotificar() {
    const resultado = await db
      .collection("drivers")
      .where("status", "==", "approved")
      .where("isAvailable", "==", true)
      .get();
    const ahoraMs = ahora();
    return resultado.docs
      .map((documento) => ({ uid: documento.id, ...documento.data() }))
      .filter((conductor) => debeRecibirla(conductor, ahoraMs));
  }

  // Borra el token inválido solo si sigue siendo el mismo: la app pudo guardar
  // uno nuevo mientras se enviaba
  async function borrarToken(uid, token) {
    const referencia = db.collection("drivers").doc(uid);
    return db.runTransaction(async (transaccion) => {
      const documento = await transaccion.get(referencia);
      if (!documento.exists || documento.data().fcmToken !== token) return false;
      transaccion.update(referencia, {
        fcmToken: FieldValue.delete(),
        fcmTokenUpdatedAt: FieldValue.delete(),
      });
      return true;
    });
  }

  /**
   * Envía "Nueva solicitud de viaje" a los conductores que deben recibirla.
   * viaje es el documento de trips con su id. Un envío que falla no detiene
   * los demás. Devuelve { enviadas, fallidas, tokensBorrados }.
   */
  async function notificarNuevaSolicitud(viaje) {
    const conductores = await conductoresParaNotificar();
    const envios = await Promise.allSettled(
      conductores.map((conductor) =>
        messaging.send(
          armarMensaje(conductor.fcmToken, viaje, conductor.notificationLanguage),
        ),
      ),
    );

    const resumen = { enviadas: 0, fallidas: 0, tokensBorrados: 0 };
    for (const [indice, envio] of envios.entries()) {
      if (envio.status === "fulfilled") {
        resumen.enviadas += 1;
        continue;
      }
      resumen.fallidas += 1;
      const { uid, fcmToken } = conductores[indice];
      if (envio.reason?.code !== TOKEN_NO_REGISTRADO) {
        logger.warn(`No se pudo notificar al conductor ${uid}:`, envio.reason?.message);
        continue;
      }
      try {
        if (await borrarToken(uid, fcmToken)) resumen.tokensBorrados += 1;
      } catch (error) {
        logger.warn(`No se pudo borrar el token del conductor ${uid}:`, error.message);
      }
    }
    return resumen;
  }

  return { notificarNuevaSolicitud, conductoresParaNotificar };
}

/**
 * Con la app de firebase-admin que ya inició quien llama (no inicia otra).
 * Carga firebase-admin aquí para que las pruebas no lo necesiten.
 */
function crearNotificacionesConApp(app, opciones = {}) {
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");
  const { getMessaging } = require("firebase-admin/messaging");
  return crearNotificaciones({
    db: getFirestore(app),
    messaging: getMessaging(app),
    FieldValue,
    ...opciones,
  });
}

module.exports = {
  crearNotificaciones,
  crearNotificacionesConApp,
  debeRecibirla,
  armarMensaje,
  CANAL_ANDROID,
  TIPO_SOLICITUD,
  VENTANA_DE_UBICACION_MS,
};
