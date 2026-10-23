import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { calculateFare } from "../../config/pricing";

export default function EarningsScreen() {
  // Estados para nuestros inputs de prueba
  const [distanceKm, setDistanceKm] = useState("5"); // 5 km por defecto
  const [durationMin, setDurationMin] = useState("15"); // 15 min por defecto
  const [tip, setTip] = useState("0");
  const [isPremium, setIsPremium] = useState(false);

  // useMemo re-ejecuta nuestra función pura en tiempo real si cambian los inputs
  const tripMath = useMemo(() => {
    return calculateFare({
      distanceKm: parseFloat(distanceKm) || 0,
      durationMin: parseFloat(durationMin) || 0,
      category: isPremium ? "premium" : "standard",
      tip: parseFloat(tip) || 0,
    });
  }, [distanceKm, durationMin, isPremium, tip]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulador de Ganancias 💰</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Distancia (Km):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={distanceKm}
          onChangeText={setDistanceKm}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tiempo (Minutos):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={durationMin}
          onChangeText={setDurationMin}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Propina (COP):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={tip}
          onChangeText={setTip}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Categoría Premium:</Text>
        <Switch value={isPremium} onValueChange={setIsPremium} />
      </View>

      {/* RESULTADOS VISUALES */}
      <View style={styles.resultsCard}>
        <Text style={styles.resultsTitle}>Resumen del Viaje</Text>

        <View style={styles.row}>
          <Text style={styles.textData}>Tarifa Total (Pasajero):</Text>
          <Text style={styles.textValue}>
            ${tripMath.fare.toLocaleString("es-CO")} COP
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.textData}>Comisión App (20%):</Text>
          <Text style={[styles.textValue, { color: "#F44336" }]}>
            - ${tripMath.commission.toLocaleString("es-CO")} COP
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.textData}>Propina (100% tuya):</Text>
          <Text style={[styles.textValue, { color: "#4CAF50" }]}>
            + ${tripMath.tip.toLocaleString("es-CO")} COP
          </Text>
        </View>

        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.textTotal}>Tu Ganancia Neta:</Text>
          <Text style={styles.textTotalValue}>
            ${tripMath.driverEarnings.toLocaleString("es-CO")} COP
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 5 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  resultsCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  textData: { fontSize: 16, color: "#555" },
  textValue: { fontSize: 16, fontWeight: "bold" },
  totalRow: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  textTotal: { fontSize: 18, fontWeight: "bold" },
  textTotalValue: { fontSize: 22, fontWeight: "bold", color: "#2E7D32" },
});
