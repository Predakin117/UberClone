// AI-assisted: see docs/AI_LOG.md #32
// true while the app is in the foreground (AppState "active"), false in the
// background or while the system covers it. The listener is removed when the
// screen unmounts.
import { useEffect, useState } from "react";
import { AppState } from "react-native";

export const useAppIsActive = () => {
  const [isActive, setIsActive] = useState(AppState.currentState === "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setIsActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  return isActive;
};
