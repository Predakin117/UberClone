// AI-assisted: see docs/AI_LOG.md #21
// Viaje en curso del conductor, leído en tiempo real de Firestore. Su status
// controla la pantalla (sección 3 del enunciado), así que vive aquí, disponible
// para toda la app: el inicio lo usa para ir al viaje y para no escuchar
// solicitudes nuevas mientras haya uno.
import { createContext, useContext } from "react";
import { useActiveTrip } from "../hooks/useActiveTrip";

export const TripContext = createContext({
  trip: null,
  isLoading: false,
  error: null,
});

export const TripProvider = ({ children }) => {
  const activeTrip = useActiveTrip();

  return (
    <TripContext.Provider value={activeTrip}>{children}</TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
