// AI-assisted: see docs/AI_LOG.md #4, #21
// Cobro y resumen del viaje (sección 3 del enunciado): tarifa final, comisión,
// ganancia neta y estado del pago. Los montos son los que se guardaron al
// completar el viaje, calculados con calculateFare.
import { useNavigation, useRoute } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";
import { paymentStatusKey } from "../../services/trips";

const formatCop = (amount) => `$${amount.toLocaleString("es-CO")} COP`;

export default function TripSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const trip = route.params?.trip;

  if (!trip) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("summary.error")}</Text>
      </View>
    );
  }

  const commissionPercent = Math.round(trip.commissionRate * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("summary.title")}</Text>

      <View style={styles.card}>
        <Text style={styles.detailText}>
          {trip.origin.address} → {trip.destination.address}
        </Text>
        <Text style={styles.detailText}>
          {t("request.km").replace("{km}", trip.distanceKm)} ·{" "}
          {t("request.minutes").replace("{minutes}", trip.durationMin)} ·{" "}
          {t(`category.${trip.category}`)}
        </Text>
      </View>

      <View style={styles.receipt}>
        <Text style={styles.receiptText}>
          {t("summary.fare")}: {formatCop(trip.fare)}
        </Text>
        <Text style={styles.receiptText}>
          {t("summary.commission").replace("{percent}", commissionPercent)}: -
          {formatCop(trip.commission)}
        </Text>
        {trip.tip > 0 && (
          <Text style={styles.receiptText}>
            {t("summary.tip")}: +{formatCop(trip.tip)}
          </Text>
        )}
        <Text style={styles.earnText}>
          {t("summary.earnings")}: {formatCop(trip.driverEarnings)}
        </Text>
        <Text style={styles.receiptText}>
          {t("summary.payment")}: {t(`payment.${trip.paymentMethod}`)} ·{" "}
          {t(paymentStatusKey(trip))}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.popToTop()}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{t("summary.backToMap")}</Text>
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
    marginVertical: 10,
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
