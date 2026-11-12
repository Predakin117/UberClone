// AI-assisted: see docs/AI_LOG.md #28
// Shared by useTripHistory and useEarningsTrips: waits for the Firebase
// session, then listens to a list of the driver's trips in real time.
// Returns { trips, isLoading, error }; error is the errorKey passed in.
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "../config/firebase";

/**
 * subscribe(uid, onTrips, onError) starts the listener and returns its
 * unsubscribe function. It must be defined outside the component so it does
 * not change on every render.
 */
export const useDriverTrips = (subscribe, errorKey) => {
  const [state, setState] = useState({
    trips: [],
    isLoading: isFirebaseConfigured,
    error: isFirebaseConfigured ? null : errorKey,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribeTrips = null;
    // The Firebase session is restored when the app opens: wait for it
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeTrips?.();
      unsubscribeTrips = null;

      if (!user) {
        setState({ trips: [], isLoading: false, error: null });
        return;
      }
      unsubscribeTrips = subscribe(
        user.uid,
        (trips) => setState({ trips, isLoading: false, error: null }),
        (tripsError) => {
          // If the composite index is missing, this message has the link to create it
          console.error("Error reading the driver's trips:", tripsError);
          setState({ trips: [], isLoading: false, error: errorKey });
        },
      );
    });

    // Cleanup: stop listening to the session and the trips
    return () => {
      unsubscribeAuth();
      unsubscribeTrips?.();
    };
  }, [subscribe, errorKey]);

  return state;
};
