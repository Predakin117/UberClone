// AI-assisted: see docs/AI_LOG.md #6, #4, #16, #17, #21
// src/screens/trip/HomeScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from "react-native-maps";
import IncomingRequestCard from "../../components/IncomingRequestCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../contexts/TripContext";
import { useDriverLocation } from "../../hooks/useDriverLocation";
import { useDriverStatus } from "../../hooks/useDriverStatus";
import { useTripRequests } from "../../hooks/useTripRequests";
import {
  canReceiveRequests,
  getAvailabilityBlock,
} from "../../services/driverStatus";

// REGLA: AsyncStorage guarda el último estado de disponibilidad
const AVAILABILITY_KEY = "@driver_availability";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const [isOnline, setIsOnline] = useState(false);
  const activeTrip = useTrip();
  const activeTripId = activeTrip.trip?.id ?? null;

  // Solo un conductor aprobado puede ponerse Disponible (sección 2 del enunciado).
  // Si la cuenta no está aprobada queda desconectado, aunque la última vez quedara conectado.
  const driverState = useDriverStatus();
  const blockKey = getAvailabilityBlock(driverState);
  const canGoOnline = blockKey === null;
  const isActive = isOnline && canGoOnline;

  // El rastreo de ubicación solo corre mientras el conductor está conectado
  const { location, errorMsg } = useDriverLocation(isActive);

  // Solicitudes nuevas: solo conectado, aprobado y sin viaje en curso. Este inicio
  // sigue montado debajo del viaje, así que sin esta condición rechazaría
  // solicitudes que el conductor no ve.
  const {
    request,
    timeLeft,
    error: requestsError,
  } = useTripRequests(
    canReceiveRequests({ isActive, activeTrip }),
    driverState.status,
  );

  // El status del viaje en Firestore controla la pantalla (sección 3): con un
  // viaje en curso se va a él, también al reabrir la app
  useEffect(() => {
    if (activeTripId) navigation.navigate("ActiveTrip");
  }, [activeTripId, navigation]);

  useEffect(() => {
    AsyncStorage.getItem(AVAILABILITY_KEY)
      .then((stored) => {
        if (stored !== null) setIsOnline(stored === "true");
      })
      .catch((error) =>
        console.error("Error leyendo la disponibilidad:", error),
      );
  }, []);

  // Centra el mapa en el conductor sin bloquear el desplazamiento manual
  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500,
    );
  }, [location]);

  const toggleOnline = () => {
    if (!canGoOnline) return;
    const next = !isActive;
    setIsOnline(next);
    AsyncStorage.setItem(AVAILABILITY_KEY, String(next)).catch((error) =>
      console.error("Error guardando la disponibilidad:", error),
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation={isActive}
        initialRegion={{
          latitude: 6.2442,
          longitude: -75.5812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />

      {/* Control de Conexión Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.onlineButton,
            isActive ? styles.online : styles.offline,
            !canGoOnline && styles.blocked,
          ]}
          onPress={toggleOnline}
          disabled={!canGoOnline}
          accessibilityRole="switch"
          accessibilityState={{ checked: isActive, disabled: !canGoOnline }}
        >
          <Text style={styles.onlineText}>
            {isActive ? t("home.online") : t("home.offline")}
          </Text>
        </TouchableOpacity>
        {blockKey && <Text style={styles.noticeText}>{t(blockKey)}</Text>}
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {requestsError && (
          <Text style={styles.errorText}>{t(requestsError)}</Text>
        )}
      </View>

      {/* Si el conductor volvió al inicio con un viaje en curso */}
      {activeTripId && (
        <TouchableOpacity
          style={styles.backToTrip}
          onPress={() => navigation.navigate("ActiveTrip")}
          accessibilityRole="button"
        >
          <Text style={styles.backToTripText}>{t("home.backToTrip")}</Text>
        </TouchableOpacity>
      )}

      {/* La solicitud más antigua, sobre el mapa. key la reinicia con cada solicitud */}
      {request && (
        <IncomingRequestCard
          key={request.id}
          trip={request}
          timeLeft={timeLeft}
          driverStatus={driverState.status}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },

  header: {
    position: "absolute",
    top: 50,
    width: "100%",
    alignItems: "center",
  },
  onlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
  },
  online: { backgroundColor: "#4CAF50" },
  offline: { backgroundColor: "#757575" },
  blocked: { opacity: 0.6 },
  noticeText: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: "white",
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  onlineText: { color: "white", fontWeight: "bold", fontSize: 16 },
  errorText: {
    marginTop: 10,
    backgroundColor: "white",
    color: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backToTrip: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  backToTripText: { color: "white", fontWeight: "bold" },
});
