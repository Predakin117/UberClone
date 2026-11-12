// AI-assisted: see docs/AI_LOG.md #21
// Viaje en curso del conductor, leído en tiempo real de Firestore. Su status
// controla la pantalla (sección 3 del enunciado), así que vive aquí, disponible
// para toda la app: el inicio lo usa para ir al viaje y para no escuchar
// solicitudes nuevas mientras haya uno. También guarda en memoria la ruta del
// conductor hasta el punto de recogida (no se guarda en Firestore).
import { createContext, useContext } from "react";
import { useActiveTrip } from "../hooks/useActiveTrip";
import { usePickupRoute } from "../hooks/usePickupRoute";

export const TripContext = createContext({
  trip: null,
  isLoading: false,
  error: null,
  pickupRoute: null,
});

export const TripProvider = ({ children }) => {
  const activeTrip = useActiveTrip();
  const pickupRoute = usePickupRoute(activeTrip.trip);

  return (
    <TripContext.Provider value={{ ...activeTrip, pickupRoute }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
