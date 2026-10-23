// AI-assisted: see docs/AI_LOG.md #31
// src/screens/trip/ActiveTripScreen.js
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView from "react-native-maps";
import { TripContext } from "../../contexts/TripContext";

const { width, height } = Dimensions.get("window");

export default function ActiveTripScreen() {
  const navigation = useNavigation();

  // Extraemos el estado global del viaje
  const { activeTrip, tripStatus, advanceTripState } = useContext(TripContext);

  const handleNextState = () => {
    if (tripStatus === "driver_arriving") {
      advanceTripState("in_progress");
    } else if (tripStatus === "in_progress") {
      advanceTripState("completed");

      // Simulamos la distancia y tiempo finales para el cobro
      const finalTripStats = {
        ...activeTrip,
        distanceKm: 8.5,
        durationMin: 20,
      };
      navigation.replace("TripSummary", { tripStats: finalTripStats });
    }
  };

  // Protección: si no hay viaje en el contexto, mostramos un mensaje de seguridad
  if (!activeTrip) {
    return (
      <View style={styles.container}>
        <Text style={styles.passengerText}>Cargando viaje activo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.2442, // Coordenadas base (Medellín)
          longitude: -75.5812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />

      <View style={styles.panel}>
        <Text style={styles.passengerText}>
          👤 Pasajero: {activeTrip?.passengerName || "Cliente VIP"}
        </Text>

        {tripStatus === "driver_arriving" && (
          <Text style={styles.routeText}>
            📍 Dirigiéndose a: {activeTrip?.pickup || "Punto de partida"}
          </Text>
        )}

        {tripStatus === "in_progress" && (
          <Text style={[styles.routeText, { color: "#2E7D32" }]}>
            🏁 En viaje hacia: {activeTrip?.dropoff || "Destino"}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            tripStatus === "in_progress" ? styles.btnFinish : styles.btnArrived,
          ]}
          onPress={handleNextState}
        >
          <Text style={styles.buttonText}>
            {tripStatus === "driver_arriving"
              ? "Llegué por el Pasajero"
              : "Finalizar Viaje"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  map: { width: width, height: height, position: "absolute", top: 0, left: 0 },
  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
  },
  passengerText: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  routeText: { fontSize: 16, color: "#555", marginBottom: 20 },
  button: { padding: 18, borderRadius: 10, alignItems: "center" },
  btnArrived: { backgroundColor: "#FF9800" },
  btnFinish: { backgroundColor: "#F44336" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
});
