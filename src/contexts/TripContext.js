import { createContext, useState } from "react";

export const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripStatus, setTripStatus] = useState("idle"); // Estados: idle, driver_arriving, in_progress, completed

  // Función para iniciar un viaje al aceptar una solicitud
  const acceptTrip = (tripData) => {
    setActiveTrip(tripData);
    setTripStatus("driver_arriving");
  };

  // Función para avanzar las etapas del viaje
  const advanceTripState = (newStatus) => {
    setTripStatus(newStatus);
  };

  // Función para limpiar la memoria al finalizar y cobrar
  const finishTrip = () => {
    setActiveTrip(null);
    setTripStatus("idle");
  };

  return (
    <TripContext.Provider
      value={{
        activeTrip,
        tripStatus,
        acceptTrip,
        advanceTripState,
        finishTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};
