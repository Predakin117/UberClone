// AI-assisted: see docs/AI_LOG.md #16
// Escucha en tiempo real el estado del registro (drivers/{uid}.status). Si se cambia
// a "approved" en la consola de Firebase, la app se entera sin reiniciarse.
// Devuelve { status, isLoading, error }.
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db, isFirebaseConfigured } from "../config/firebase";

export const useDriverStatus = () => {
  const [state, setState] = useState({
    status: null,
    isLoading: isFirebaseConfigured,
    error: isFirebaseConfigured ? null : "notConfigured",
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribeDriver = null;
    // La sesión de Firebase se restaura al abrir la app: se espera a conocerla
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeDriver?.();
      unsubscribeDriver = null;

      if (!user) {
        setState({ status: null, isLoading: false, error: "noSession" });
        return;
      }
      unsubscribeDriver = onSnapshot(
        doc(db, "drivers", user.uid),
        (snapshot) =>
          setState({
            status: snapshot.data()?.status ?? null,
            isLoading: false,
            error: null,
          }),
        (error) => {
          console.error("Error leyendo el estado del conductor:", error);
          setState({ status: null, isLoading: false, error: "readFailed" });
        },
      );
    });

    // Limpieza: se dejan de escuchar la sesión y el documento al salir de la pantalla
    return () => {
      unsubscribeAuth();
      unsubscribeDriver?.();
    };
  }, []);

  return state;
};
