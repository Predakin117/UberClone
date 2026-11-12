// AI-assisted: see docs/AI_LOG.md #4, #21
// Tarjeta de solicitud nueva (sección 3 del enunciado). HomeScreen la muestra
// sobre el mapa con la solicitud más antigua y los segundos que quedan para
// responder; el temporizador vive en useTripRequests.
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { calculateFare } from "../config/pricing";
import { useLanguage } from "../contexts/LanguageContext";
import { respondToRequest } from "../services/tripRepository";
import { TRIP_STATUS } from "../services/trips";

const formatCop = (amount) => `$${amount.toLocaleString("es-CO")} COP`;

export default function IncomingRequestCard({ trip, timeLeft, driverStatus }) {
  const { t } = useLanguage();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // La misma función que cierra el viaje: la estimación coincide con el cobro.
  // Con una categoría desconocida no hay estimación.
  const estimate = useMemo(() => {
    try {
      return calculateFare({
        distanceKm: trip.distanceKm,
        durationMin: trip.durationMin,
        category: trip.category,
      });
    } catch {
      return null;
    }
  }, [trip.distanceKm, trip.durationMin, trip.category]);

  // Al aceptar no se navega desde aquí: el viaje pasa a "accepted" en Firestore y
  // HomeScreen lleva al conductor al viaje según ese status
  const handleAccept = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      await respondToRequest(trip.id, TRIP_STATUS.ACCEPTED, driverStatus);
    } catch (acceptError) {
      console.error("Error aceptando la solicitud:", acceptError.cause ?? acceptError);
      setError(acceptError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip.id, driverStatus]);

  // Al rechazar, la solicitud sale de la lista y HomeScreen deja de mostrarla
  const handleReject = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      await respondToRequest(trip.id, TRIP_STATUS.REJECTED, driverStatus);
    } catch (rejectError) {
      console.error("Error rechazando la solicitud:", rejectError.cause ?? rejectError);
      setError(rejectError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip.id, driverStatus]);

  const rows = [
    [t("request.origin"), trip.origin?.address],
    [t("request.destination"), trip.destination?.address],
    [t("request.distance"), t("request.km").replace("{km}", trip.distanceKm)],
    [
      t("request.duration"),
      t("request.minutes").replace("{minutes}", trip.durationMin),
    ],
    [t("request.category"), t(`category.${trip.category}`)],
    [t("request.paymentMethod"), t(`payment.${trip.paymentMethod}`)],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.timerText}>
          {t("request.seconds").replace("{seconds}", timeLeft)}
        </Text>
        <Text style={styles.title}>{t("request.title")}</Text>

        <View style={styles.infoContainer}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
          {estimate && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>{t("request.fare")}</Text>
                <Text style={styles.value}>{formatCop(estimate.fare)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t("request.earnings")}</Text>
                <Text style={styles.earningsText}>
                  {formatCop(estimate.driverEarnings)}
                </Text>
              </View>
            </>
          )}
        </View>

        {error && <Text style={styles.errorText}>{t(error)}</Text>}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.btnReject, isSending && styles.disabled]}
            onPress={handleReject}
            disabled={isSending}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t("request.reject")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.btnAccept, isSending && styles.disabled]}
            onPress={handleAccept}
            disabled={isSending}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t("request.accept")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
  infoContainer: { width: "100%", marginBottom: 20, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 14, color: "#666" },
  value: { flex: 1, fontSize: 14, color: "#222", textAlign: "right" },
  earningsText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "right",
  },
  errorText: { color: "red", fontSize: 13, marginBottom: 12 },
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
  disabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
