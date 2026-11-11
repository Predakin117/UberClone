// AI-assisted: see docs/AI_LOG.md #6, #4, #16
// src/screens/trip/HomeScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from "react-native-maps";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDriverLocation } from "../../hooks/useDriverLocation";
import { useDriverStatus } from "../../hooks/useDriverStatus";
import { getAvailabilityBlock } from "../../services/driverStatus";

// REGLA: AsyncStorage guarda el último estado de disponibilidad
const AVAILABILITY_KEY = "@driver_availability";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const [isOnline, setIsOnline] = useState(false);

  // Solo un conductor aprobado puede ponerse Disponible (sección 2 del enunciado).
  // Si la cuenta no está aprobada queda desconectado, aunque la última vez quedara conectado.
  const blockKey = getAvailabilityBlock(useDriverStatus());
  const canGoOnline = blockKey === null;
  const isActive = isOnline && canGoOnline;

  // El rastreo de ubicación solo corre mientras el conductor está conectado
  const { location, errorMsg } = useDriverLocation(isActive);

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

  const handleSimulateRequest = () => {
    // La solicitud y su temporizador de 15 s viven en IncomingRequestScreen
    navigation.navigate("IncomingRequest");
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
            {isActive ? "CONECTADO" : "DESCONECTADO"}
          </Text>
        </TouchableOpacity>
        {blockKey && <Text style={styles.noticeText}>{t(blockKey)}</Text>}
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>

      {/* Botón de simulación (Solo visible si estás conectado) */}
      {isActive && (
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulateRequest}
        >
          <Text style={styles.simulateBtnText}>Simular Solicitud</Text>
        </TouchableOpacity>
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

  simulateBtn: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  simulateBtnText: { color: "white", fontWeight: "bold" },
});
