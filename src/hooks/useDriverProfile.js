// AI-assisted: see docs/AI_LOG.md #30, #61
// Listens in real time to the driver's document (drivers/{uid}) and to the
// ratings of their finished trips. Returns { driver, rating, isLoading,
// error, tripCount }: driver is null without a registration; rating is
// { average, count } of averageRating; tripCount is the number of finished
// trips; error is a key of src/i18n/strings.js.
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { auth, isFirebaseConfigured } from "../config/firebase";
import { subscribeToDriver } from "../services/driverRepository";
import { averageRating } from "../services/driverProfile";
import { subscribeToTripsSince } from "../services/tripRepository";
import { useDriverTrips } from "./useDriverTrips";

// Every finished trip, from the beginning (completedAt >= 0)
const subscribeToAllFinishedTrips = (uid, onTrips, onError) =>
  subscribeToTripsSince(uid, 0, onTrips, onError);

export const useDriverProfile = () => {
  const [state, setState] = useState({
    driver: null,
    isLoading: isFirebaseConfigured,
    error: isFirebaseConfigured ? null : "profile.loadFailed",
  });
  const { trips } = useDriverTrips(
    subscribeToAllFinishedTrips,
    "profile.loadFailed",
  );
  const rating = useMemo(() => averageRating(trips), [trips]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribeDriver = null;
    // The Firebase session is restored when the app opens: wait for it
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeDriver?.();
      unsubscribeDriver = null;

      if (!user) {
        setState({ driver: null, isLoading: false, error: null });
        return;
      }
      unsubscribeDriver = subscribeToDriver(
        user.uid,
        (driver) => setState({ driver, isLoading: false, error: null }),
        (driverError) => {
          console.error("Error reading the driver profile:", driverError);
          setState({ driver: null, isLoading: false, error: "profile.loadFailed" });
        },
      );
    });

    // Cleanup: stop listening to the session and the document
    return () => {
      unsubscribeAuth();
      unsubscribeDriver?.();
    };
  }, []);

  return { ...state, rating, tripCount: trips.length };
};
