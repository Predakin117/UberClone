// AI-assisted: see docs/AI_LOG.md #4, #27
// Mientras el conductor está conectado (isAvailable), rastrea su ubicación y la
// guarda en drivers/{uid} como máximo cada 10 segundos (src/services/driverLocation.js).
// Con un viaje en curso (hasActiveTrip) sigue guardando la ubicación, pero queda
// no disponible para solicitudes nuevas. Al desconectarse o salir de la pantalla
// deja de rastrear y lo marca no disponible.
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  availabilityOnTripChange,
  isDriverAvailable,
  markDriverUnavailable,
  saveDriverLocation,
  setDriverAvailability,
  shouldSaveLocation,
} from "../services/driverLocation";

export const useDriverLocation = (isAvailable, hasActiveTrip = false) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Disponibilidad actual, leída en cada ubicación sin reiniciar el rastreo
  const availableRef = useRef(false);
  // Si había un viaje en curso la última vez, para notar cuándo empieza o termina
  const hadActiveTripRef = useRef(hasActiveTrip);
  useEffect(() => {
    availableRef.current = isDriverAvailable({
      isOnline: isAvailable,
      hasActiveTrip,
    });
    // Al empezar o terminar un viaje estando conectado, se guarda de una vez
    const update = availabilityOnTripChange({
      hadActiveTrip: hadActiveTripRef.current,
      hasActiveTrip,
      isOnline: isAvailable,
    });
    hadActiveTripRef.current = hasActiveTrip;
    if (update !== null) setDriverAvailability(update);
  }, [isAvailable, hasActiveTrip]);

  useEffect(() => {
    // Solo se rastrea cuando el conductor está "Disponible"
    if (!isAvailable) return;

    let locationSubscription = null;
    // Evita dejar una suscripción viva si la limpieza ocurre antes de que termine el await
    let cancelled = false;
    // Hora (ms) de la última ubicación enviada a Firestore
    let lastSavedMs = null;

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
            if (cancelled) return;
            const { latitude, longitude } = newLocation.coords;
            setLocation({ latitude, longitude });

            // El mapa se mueve con cada lectura, pero Firestore recibe como máximo una cada 10 s
            const now = Date.now();
            if (shouldSaveLocation(lastSavedMs, now)) {
              lastSavedMs = now;
              saveDriverLocation({ latitude, longitude }, availableRef.current);
            }
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
      }
      // Desconectado o fuera de la pantalla: deja de estar disponible en Firestore
      markDriverUnavailable();
    };
  }, [isAvailable]); // Se re-ejecuta si el conductor cambia su estado de disponibilidad

  return { location, errorMsg };
};
