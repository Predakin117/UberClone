// AI-assisted: see docs/AI_LOG.md #21
// Único lugar que sabe de dónde vienen las solicitudes (docs/APIS.md, servicio 11).
// Hoy son los viajes de trips en "requested". Cuando llegue la API del pasajero de
// la profesora, solo cambia este archivo y las pantallas quedan igual.
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { sortOldestFirst, TRIP_STATUS } from "./trips";

/**
 * Escucha las solicitudes nuevas (sin conductor). onRequests recibe la lista con la
 * más antigua primero; onError, el error si no se pueden leer. Devuelve la función
 * que deja de escuchar, para la limpieza del useEffect.
 */
export const subscribeToNewRequests = (onRequests, onError) => {
  if (!db) {
    onError(new Error("Firebase no está configurado en el .env"));
    return () => {};
  }

  // Mismo filtro que firestore.rules (status == "requested"). El orden por
  // createdAt se hace aquí, así la consulta no necesita un índice compuesto.
  const requests = query(
    collection(db, "trips"),
    where("status", "==", TRIP_STATUS.REQUESTED),
  );
  return onSnapshot(
    requests,
    (snapshot) =>
      onRequests(
        sortOldestFirst(
          snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() })),
        ),
      ),
    onError,
  );
};
