// AI-assisted: see docs/AI_LOG.md #28
// Listens in real time to one trip by id, for example to see its payment
// status change. Returns { trip, error }: trip is null until the first
// snapshot arrives or if the trip does not exist; error is a key of
// src/i18n/strings.js.
import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "../config/firebase";
import { subscribeToTrip } from "../services/tripRepository";

export const useTrip = (tripId) => {
  const [state, setState] = useState({ trip: null, error: null });

  useEffect(() => {
    if (!tripId || !isFirebaseConfigured) return;

    const unsubscribe = subscribeToTrip(
      tripId,
      (trip) => setState({ trip, error: null }),
      (tripError) => {
        console.error("Error reading the trip:", tripError);
        setState((current) => ({ ...current, error: "summary.error" }));
      },
    );
    // Cleanup: stop listening when the screen closes or the id changes
    return unsubscribe;
  }, [tripId]);

  return state;
};
