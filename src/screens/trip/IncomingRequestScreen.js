// AI-assisted: see docs/AI_LOG.md #4
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TripContext } from "../../contexts/TripContext";
import { useTripRequests } from "../../hooks/useTripRequests";

export default function IncomingRequestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { acceptTrip } = useContext(TripContext);

  const incomingData = route.params?.requestData || {
    id: "trip_999",
    passengerName: "María Gómez",
    pickup: "Parque Lleras, Medellín",
    dropoff: "Aeropuerto JMC",
    estimatedFare: 75000,
    status: "requested",
  };

  const handleAutoReject = useCallback(() => {
    console.log("Solicitud rechazada automáticamente por tiempo.");
    navigation.goBack(); // Devolvemos al conductor al mapa
  }, [navigation]);

  const { request, timeLeft, acceptRequest, rejectRequest } = useTripRequests(
    incomingData,
    handleAutoReject,
  );

  const handleAccept = () => {
    acceptRequest();
    // ActiveTripScreen lee el viaje desde el TripContext
    acceptTrip({ ...request, status: "accepted" });
    navigation.replace("ActiveTrip");
  };

  const handleManualReject = () => {
    rejectRequest();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.timerText}>{timeLeft}s</Text>
        <Text style={styles.title}>¡Nueva Solicitud!</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            👤 Pasajero: {incomingData.passengerName}
          </Text>
          <Text style={styles.infoText}>📍 Origen: {incomingData.pickup}</Text>
          <Text style={styles.infoText}>
            🏁 Destino: {incomingData.dropoff}
          </Text>
          <Text style={styles.fareText}>
            💵 Tarifa Est.: $
            {incomingData.estimatedFare.toLocaleString("es-CO")} COP
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.btnReject]}
            onPress={handleManualReject}
          >
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.btnAccept]}
            onPress={handleAccept}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
  },
  timerText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#E53935",
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  infoContainer: { width: "100%", marginBottom: 20 },
  infoText: { fontSize: 16, marginBottom: 8, color: "#333" },
  fareText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  btnReject: { backgroundColor: "#F44336" },
  btnAccept: { backgroundColor: "#4CAF50" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
