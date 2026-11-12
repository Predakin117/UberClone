// AI-assisted: see docs/AI_LOG.md #31
// Position and heading of the car for the trip map, read-only: it does not
// save anything to Firestore (useDriverLocation on the home screen does that).
// Returns { latitude, longitude, heading } or null without permission or GPS.
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { nextHeading } from "../services/carHeading";

export const useCarPosition = (enabled = true) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let subscription = null;
    // The cleanup can run before watchPositionAsync answers
    let cancelled = false;

    const start = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (cancelled || status !== "granted") return;
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 3,
          },
          ({ coords }) => {
            if (cancelled) return;
            setPosition((previous) => ({
              latitude: coords.latitude,
              longitude: coords.longitude,
              heading: nextHeading(previous?.heading, coords),
            }));
          },
        );
        if (cancelled) watcher.remove();
        else subscription = watcher;
      } catch (error) {
        console.warn("Could not follow the car position:", error);
      }
    };

    start();
    // Cleanup: stop following the GPS when the screen closes
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return position;
};
