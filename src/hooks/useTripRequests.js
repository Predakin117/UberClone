// AI-assisted: see docs/AI_LOG.md #4, #21
// Solicitudes nuevas para el conductor (sección 3 del enunciado). Mientras está
// conectado y aprobado escucha la fuente de solicitudes y muestra la más antigua,
// con 15 segundos para responder. Si se vencen, la solicitud queda "rejected".
import { useEffect, useState } from "react";
import { respondToRequest } from "../services/tripRepository";
import { subscribeToNewRequests } from "../services/tripRequestsSource";
import { TRIP_STATUS } from "../services/trips";

export const REQUEST_SECONDS = 15;

export const useTripRequests = (isActive, driverStatus) => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState({
    tripId: null,
    timeLeft: REQUEST_SECONDS,
  });

  // Escucha solo mientras el conductor está conectado y aprobado. La limpieza deja
  // de escuchar al desconectarse o al salir de la pantalla.
  useEffect(() => {
    if (!isActive) return;
    return subscribeToNewRequests(
      (list) => {
        setRequests(list);
        setError(null);
      },
      (subscribeError) => {
        console.error("Error escuchando las solicitudes:", subscribeError);
        setError("trip.error.loadFailed");
      },
    );
  }, [isActive]);

  // Desconectado no se muestra nada, aunque quede la última lista en memoria
  const request = isActive ? (requests[0] ?? null) : null;
  const tripId = request?.id ?? null;

  // Cuenta regresiva de la solicitud que se muestra. Se reinicia si cambia la
  // solicitud y la limpieza la detiene si el conductor responde antes.
  useEffect(() => {
    if (!tripId) return;
    let secondsLeft = REQUEST_SECONDS;
    const timer = setInterval(() => {
      secondsLeft -= 1;
      setCountdown({ tripId, timeLeft: Math.max(secondsLeft, 0) });
      if (secondsLeft > 0) return;

      clearInterval(timer);
      // Sin respuesta a tiempo: la solicitud queda "rejected" (sección 3)
      respondToRequest(tripId, TRIP_STATUS.REJECTED, driverStatus).catch(
        (rejectError) =>
          console.error("Error rechazando la solicitud vencida:", rejectError),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [tripId, driverStatus]);

  const timeLeft =
    countdown.tripId === tripId ? countdown.timeLeft : REQUEST_SECONDS;

  return { request, timeLeft, error: isActive ? error : null };
};
