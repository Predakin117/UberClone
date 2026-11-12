// AI-assisted: see docs/AI_LOG.md #4, #21, #28, #29
// Cobro y resumen del viaje (sección 3 del enunciado): tarifa final, comisión,
// ganancia neta y estado del pago. Los montos son los que se guardaron al
// completar el viaje, calculados con calculateFare. The trip is listened to in
// real time so the payment status changes on screen when the backend writes it.
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FieldMessage from "../../components/FieldMessage";
import {
  CONTROL_HEIGHT,
  colors,
  radius,
  spacing,
  typography,
} from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../hooks/useTrip";
import { markCashReceived } from "../../services/payments";
import { TRIP_STATUS, paymentStatusKey } from "../../services/trips";

const formatCop = (amount) => `$${amount.toLocaleString("es-CO")} COP`;

export default function TripSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const paramTrip = route.params?.trip;
  // The live trip once the first snapshot arrives; the one from the route meanwhile
  const { trip: liveTrip } = useTrip(paramTrip?.id);
  const trip = liveTrip ?? paramTrip;

  const [isConfirming, setIsConfirming] = useState(false);
  const [cashError, setCashError] = useState(null);

  if (!trip) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("summary.error")}</Text>
      </View>
    );
  }

  const commissionPercent = Math.round(trip.commissionRate * 100);
  const canConfirmCash =
    trip.paymentMethod === "cash" && trip.status !== TRIP_STATUS.PAID;

  const confirmCash = async () => {
    setCashError(null);
    setIsConfirming(true);
    const result = await markCashReceived(trip.id);
    setIsConfirming(false);
    // On success the snapshot brings status "paid" and the button goes away
    if (!result.ok) setCashError(`payment.error.${result.codigoError}`);
  };

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

      {canConfirmCash && (
        <View style={styles.cashBlock}>
          <TouchableOpacity
            style={[styles.cashButton, isConfirming && styles.cashButtonBusy]}
            onPress={confirmCash}
            disabled={isConfirming}
            accessibilityRole="button"
            accessibilityState={{ disabled: isConfirming, busy: isConfirming }}
          >
            {isConfirming ? (
              <View style={styles.busyRow}>
                <ActivityIndicator color={colors.black} />
                <Text style={styles.cashButtonText}>
                  {t("summary.confirmingCash")}
                </Text>
              </View>
            ) : (
              <Text style={styles.cashButtonText}>
                {t("summary.cashReceived")}
              </Text>
            )}
          </TouchableOpacity>
          <FieldMessage error={cashError ? t(cashError) : null} />
        </View>
      )}

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
    padding: spacing.xl - 4,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  title: {
    ...typography.title,
    textAlign: "center",
    marginBottom: spacing.xl - 4,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl - 4,
    borderRadius: radius.md,
    marginBottom: spacing.xl - 4,
  },
  detailText: { ...typography.body, marginBottom: spacing.sm + 2 },
  receipt: {
    backgroundColor: colors.surface,
    padding: spacing.xl - 4,
    borderRadius: radius.md,
    marginBottom: spacing.xxl + 8,
  },
  receiptText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 2,
  },
  earnText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.success,
    marginVertical: spacing.sm + 2,
  },
  errorText: { ...typography.body, fontSize: 18, color: colors.error, textAlign: "center" },
  cashBlock: { marginTop: -spacing.xl, marginBottom: spacing.xl },
  cashButton: {
    minHeight: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cashButtonBusy: { borderColor: colors.border },
  busyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cashButtonText: { color: colors.black, fontSize: 18, fontWeight: "700" },
  // Main button: black with white text
  button: {
    minHeight: CONTROL_HEIGHT + 4,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
});
