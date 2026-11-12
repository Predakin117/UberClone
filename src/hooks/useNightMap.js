// AI-assisted: see docs/AI_LOG.md #31
// Props for MapView that turn the map dark between 6 p.m. and 6 a.m. The hour
// is checked every minute, so the map changes on its own at 6.
// Usage: <MapView {...useNightMap()} />
import { useEffect, useState } from "react";
import { DARK_MAP_STYLE, isNightTime } from "../config/mapStyle";

const CHECK_EVERY_MS = 60 * 1000;

export const useNightMap = () => {
  const [isNight, setIsNight] = useState(() => isNightTime());

  useEffect(() => {
    const timer = setInterval(() => setIsNight(isNightTime()), CHECK_EVERY_MS);
    // Cleanup: stop checking the hour when the map closes
    return () => clearInterval(timer);
  }, []);

  return {
    // Android (Google Maps); Apple Maps ignores it without failing
    customMapStyle: isNight ? DARK_MAP_STYLE : [],
    // iOS (Apple Maps)
    userInterfaceStyle: isNight ? "dark" : "light",
  };
};
