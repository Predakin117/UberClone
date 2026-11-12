// AI-assisted: see docs/AI_LOG.md #21
// Escucha en tiempo real el viaje en curso del conductor (accepted,
// driver_arriving o in_progress). Devuelve { trip, isLoading, error }: trip es
// null si no tiene viaje en curso.
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "../config/firebase";
import { subscribeToActiveTrip } from "../services/tripRepository";

export const useActiveTrip = () => {
  const [state, setState] = useState({
    trip: null,
    isLoading: isFirebaseConfigured,
    error: isFirebaseConfigured ? null : "trip.error.loadFailed",
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribeTrip = null;
    // La sesión de Firebase se restaura al abrir la app: así, si se reabre en
    // medio de un viaje, se encuentra de nuevo
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeTrip?.();
      unsubscribeTrip = null;

      if (!user) {
        setState({ trip: null, isLoading: false, error: null });
        return;
      }
      unsubscribeTrip = subscribeToActiveTrip(
        user.uid,
        (trip) => setState({ trip, isLoading: false, error: null }),
        (tripError) => {
          console.error("Error leyendo el viaje en curso:", tripError);
          setState({ trip: null, isLoading: false, error: "trip.error.loadFailed" });
        },
      );
    });

    // Limpieza: deja de escuchar la sesión y el viaje
    return () => {
      unsubscribeAuth();
      unsubscribeTrip?.();
    };
  }, []);

  return state;
};
