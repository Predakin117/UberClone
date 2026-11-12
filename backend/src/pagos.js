// AI-assisted: see docs/AI_LOG.md #26
// Pagos del viaje (sección 4 del enunciado). El backend es el único que escribe
// paymentStatus y el estado "paid": las reglas de Firestore no se lo permiten a
// la app. auth y db son los de firebase-admin; las pruebas pasan unos simulados.
//
// Cada función devuelve { status, cuerpo } para responder por HTTP.

const PAGO_EN_EFECTIVO = { paymentStatus: "cash", status: "paid" };

const error = (status, codigoError, mensaje) => ({
  status,
  cuerpo: { ok: false, codigoError, error: mensaje },
});

// El token de Firebase Auth que la app manda en "Authorization: Bearer <token>"
function leerToken(cabecera) {
  const coincide = /^Bearer\s+(\S+)$/i.exec(cabecera ?? "");
  return coincide ? coincide[1] : null;
}

function crearPagos({ auth, db }) {
  // uid del conductor dueño del token, o null si el token no sirve
  async function verificarConductor(cabecera) {
    const token = leerToken(cabecera);
    if (!token) return null;
    try {
      const decodificado = await auth.verifyIdToken(token);
      return decodificado.uid;
    } catch {
      return null;
    }
  }

  /**
   * POST /pagos/efectivo { tripId }: el conductor confirma que recibió el
   * efectivo. Solo si el viaje está "completed", es suyo y su paymentMethod es
   * "cash", queda con paymentStatus "cash" y status "paid". Si ya estaba pagado
   * en efectivo, responde ok sin escribir (la app pudo reintentar tras perder
   * la conexión).
   */
  async function confirmarEfectivo(cabecera, body) {
    const uid = await verificarConductor(cabecera);
    if (!uid) {
      return error(401, "no_autorizado", "Falta el token del conductor o no es válido");
    }
    const tripId = body?.tripId;
    if (typeof tripId !== "string" || tripId.trim() === "" || tripId.includes("/")) {
      return error(400, "datos_invalidos", "tripId debe ser el id de un viaje");
    }

    const referencia = db.collection("trips").doc(tripId);
    // En una transacción: si dos peticiones llegan a la vez, solo una escribe
    return db.runTransaction(async (transaccion) => {
      const documento = await transaccion.get(referencia);
      if (!documento.exists) return error(404, "no_encontrado", "El viaje no existe");

      const viaje = documento.data();
      if (viaje.driverId !== uid) {
        return error(403, "no_es_tu_viaje", "El viaje es de otro conductor");
      }
      if (viaje.paymentMethod !== "cash") {
        return error(409, "metodo_invalido", "El viaje no se paga en efectivo");
      }
      if (viaje.status === "paid" && viaje.paymentStatus === "cash") {
        return { status: 200, cuerpo: { ok: true } };
      }
      if (viaje.status !== "completed") {
        return error(409, "estado_invalido", "El viaje todavía no está terminado");
      }

      transaccion.update(referencia, PAGO_EN_EFECTIVO);
      return { status: 200, cuerpo: { ok: true } };
    });
  }

  return { confirmarEfectivo };
}

module.exports = { crearPagos, leerToken };
