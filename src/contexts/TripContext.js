import { createContext, useState } from "react";

export const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripStatus, setTripStatus] = useState("idle"); // States: idle, driver_arriving, in_progress, completed

  // Starts a trip when a request is accepted
  const acceptTrip = (tripData) => {
    setActiveTrip(tripData);
    setTripStatus("driver_arriving");
  };

  // Moves the trip to its next stage
  const advanceTripState = (newStatus) => {
    setTripStatus(newStatus);
  };

  // Clears the trip state after finishing and charging
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
