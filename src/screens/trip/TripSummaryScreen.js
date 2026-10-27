// AI-assisted: see docs/AI_LOG.md #4
import { useNavigation, useRoute } from "@react-navigation/native";
import { useContext, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { calculateFare } from "../../config/pricing";
import { TripContext } from "../../contexts/TripContext";

export default function TripSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Extraemos la función para limpiar el viaje global
  const { finishTrip } = useContext(TripContext);

  const { tripStats } = route.params || {};

  // Calculamos la tarifa usando nuestra regla de negocio (pura matemática)
  const fareDetails = useMemo(() => {
    if (!tripStats) return null;
    return calculateFare({
      distanceKm: tripStats.distanceKm,
      durationMin: tripStats.durationMin,
      tip: tripStats.tip || 0,
    });
  }, [tripStats]);

  const handleFinish = () => {
    finishTrip(); // Limpiamos el estado global para no dejar "viajes fantasmas"
    navigation.popToTop(); // Volvemos al mapa de inicio
  };

  if (!tripStats || !fareDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Error al cargar el resumen del viaje.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen del Viaje</Text>

      <View style={styles.card}>
        <Text style={styles.detailText}>
          Distancia: {tripStats.distanceKm} km
        </Text>
        <Text style={styles.detailText}>
          Tiempo: {tripStats.durationMin} min
        </Text>
      </View>

      <View style={styles.receipt}>
        <Text style={styles.receiptText}>
          Costo Total: ${fareDetails.fare.toLocaleString("es-CO")} COP
        </Text>
        <Text style={styles.receiptText}>
          Comisión (20%): -$
          {fareDetails.commission.toLocaleString("es-CO")} COP
        </Text>
        <Text style={styles.earnText}>
          Tu Ganancia: $
          {fareDetails.driverEarnings.toLocaleString("es-CO")} COP
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Volver al Mapa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailText: { fontSize: 16, marginBottom: 10, color: "#333" },
  receipt: {
    backgroundColor: "#e8f5e9",
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  receiptText: { fontSize: 16, marginBottom: 10, color: "#424242" },
  earnText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
  },
  errorText: { fontSize: 18, color: "red", textAlign: "center" },
  button: {
    backgroundColor: "#000",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
