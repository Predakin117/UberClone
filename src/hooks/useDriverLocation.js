// AI-assisted: see docs/AI_LOG.md #4
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useDriverLocation = (isAvailable) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Solo se rastrea cuando el conductor está "Disponible"
    if (!isAvailable) return;

    let locationSubscription = null;
    // Evita dejar una suscripción viva si la limpieza ocurre antes de que termine el await
    let cancelled = false;

    const startTracking = async () => {
      try {
        // 1. Pedir permisos de primer plano
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== "granted") {
          setErrorMsg("Permiso de ubicación denegado.");
          return;
        }
        setErrorMsg(null);

        // 2. Iniciar rastreo
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Actualiza cada 5 segundos
            distanceInterval: 5, // O cada 5 metros
          },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;
            setLocation({ latitude, longitude });

            // TODO: Aquí irá el fetch a tu backend/Firebase para actualizar la posición en tiempo real
            console.log(`[BD UPDATE] Lat: ${latitude}, Lng: ${longitude}`);
          },
        );

        if (cancelled) {
          subscription.remove();
          return;
        }
        locationSubscription = subscription;
      } catch (error) {
        console.error("Error en la ubicación:", error);
        if (!cancelled) setErrorMsg("Error obteniendo la ubicación.");
      }
    };

    startTracking();

    // 3. REGLA OBLIGATORIA: Función de limpieza del useEffect
    return () => {
      cancelled = true;
      if (locationSubscription) {
        locationSubscription.remove();
        console.log("Rastreo detenido (Limpieza de useEffect ejecutada).");
      }
    };
  }, [isAvailable]); // Se re-ejecuta si el conductor cambia su estado de disponibilidad

  return { location, errorMsg };
};
