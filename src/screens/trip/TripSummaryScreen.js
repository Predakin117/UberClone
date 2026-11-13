// AI-assisted: see docs/AI_LOG.md #4, #21, #28, #29, #31, #61
// Payment and summary of the trip (section 3 of the assignment): final fare,
// commission, net earnings and payment status. The amounts are the ones saved
// when the trip was completed, calculated with calculateFare. The trip is
// listened to in real time so the payment status changes on screen when the
// backend writes it. The driver can also rate the passenger once
// (PassengerRating).
// It looks like an Uber receipt: a green check, the net earnings in big
// numbers, the route, duration, distance and payment, and the breakdown.
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FareBreakdown from "../../components/FareBreakdown";
import FieldMessage from "../../components/FieldMessage";
import PassengerRating from "../../components/PassengerRating";
import PaymentStatusChip from "../../components/PaymentStatusChip";
import RouteStops from "../../components/RouteStops";
import TripStats from "../../components/TripStats";
import {
  CONTROL_HEIGHT,
  colors,
  radius,
  spacing,
  typography,
} from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../hooks/useTrip";
import { formatCop, formatDateTime } from "../../i18n/format";
import { completedAtMillis } from "../../services/earnings";
import { markCashReceived } from "../../services/payments";
import { TRIP_STATUS } from "../../services/trips";

const CHECK_SIZE = 64;

export default function TripSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const paramTrip = route.params?.trip;
  // The live trip once the first snapshot arrives; the one from the route meanwhile
  const { trip: liveTrip } = useTrip(paramTrip?.id);
  const trip = liveTrip ?? paramTrip;

  const [isConfirming, setIsConfirming] = useState(false);
  const [cashError, setCashError] = useState(null);

  if (!trip) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t("summary.error")}</Text>
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

  // Right after finishing, completedAt is still on its way from the server
  const completedDate = formatDateTime(completedAtMillis(trip), language);
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
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={36} color={colors.success} />
          </View>
          <Text style={styles.overline}>{t("summary.title")}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {t("summary.completed")}
          </Text>
          <Text style={styles.caption}>
            {[completedDate, t(`category.${trip.category}`)]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>

        <View style={styles.earnedBox}>
          <Text style={styles.earnedLabel}>{t("tripDetail.earned")}</Text>
          <Text style={styles.earned}>{formatCop(trip.driverEarnings)}</Text>
          <PaymentStatusChip trip={trip} />
        </View>

        {canConfirmCash && (
          <View>
            <TouchableOpacity
              style={[styles.cashButton, isConfirming && styles.cashButtonBusy]}
              onPress={confirmCash}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityState={{
                disabled: isConfirming,
                busy: isConfirming,
              }}
            >
              {isConfirming ? (
                <View style={styles.busyRow}>
                  <ActivityIndicator color={colors.black} />
                  <Text style={styles.cashButtonText}>
                    {t("summary.confirmingCash")}
                  </Text>
                </View>
              ) : (
                <View style={styles.busyRow}>
                  <Ionicons
                    name="cash-outline"
                    size={22}
                    color={colors.black}
                  />
                  <Text style={styles.cashButtonText}>
                    {t("summary.cashReceived")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <FieldMessage error={cashError ? t(cashError) : null} />
          </View>
        )}

        <View style={styles.receipt}>
          <RouteStops
            origin={trip.origin.address}
            destination={trip.destination.address}
            originLabel={t("request.origin")}
            destinationLabel={t("request.destination")}
            numberOfLines={2}
          />
        </View>

        <TripStats trip={trip} />

        <Text style={styles.sectionTitle}>{t("tripDetail.breakdown")}</Text>
        <FareBreakdown trip={trip} />

        <View style={styles.ratingCard}>
          <PassengerRating trip={trip} style={styles.rating} />
        </View>
      </ScrollView>

      {/* The main button stays at the bottom, like Uber */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.popToTop()}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{t("summary.backToMap")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl - 4,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl - 4,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  header: { alignItems: "center", gap: spacing.xs },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    backgroundColor: colors.successBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  overline: { ...typography.caption, fontWeight: "600" },
  title: { ...typography.title, fontSize: 26, textAlign: "center" },
  caption: { ...typography.caption, textAlign: "center" },
  earnedBox: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  earnedLabel: { ...typography.label },
  earned: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  receipt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  sectionTitle: { ...typography.section, fontSize: 18, marginTop: spacing.sm },
  ratingCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  rating: { marginBottom: 0 },
  errorText: {
    ...typography.body,
    fontSize: 18,
    color: colors.error,
    textAlign: "center",
  },
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
  footer: {
    paddingHorizontal: spacing.xl - 4,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
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
