// AI-assisted: see docs/AI_LOG.md #33, #4
// src/screens/trip/HomeScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from "react-native-maps";
import { useDriverLocation } from "../../hooks/useDriverLocation";

// REGLA: AsyncStorage guarda el último estado de disponibilidad
const AVAILABILITY_KEY = "@driver_availability";

export default function HomeScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [isOnline, setIsOnline] = useState(false);

  // El rastreo de ubicación solo corre mientras el conductor está conectado
  const { location, errorMsg } = useDriverLocation(isOnline);

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
    const next = !isOnline;
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
        showsUserLocation={isOnline}
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
            isOnline ? styles.online : styles.offline,
          ]}
          onPress={toggleOnline}
        >
          <Text style={styles.onlineText}>
            {isOnline ? "CONECTADO" : "DESCONECTADO"}
          </Text>
        </TouchableOpacity>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>

      {/* Botón de simulación (Solo visible si estás conectado) */}
      {isOnline && (
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
