// AI-assisted: see docs/AI_LOG.md #4, #21, #28, #29, #31, #61, #62, #63
// Payment and summary of the trip (section 3 of the assignment): final fare,
// commission, net earnings and payment status. The amounts are the ones saved
// when the trip was completed, calculated with calculateFare. The trip is
// listened to in real time so the payment status changes on screen when the
// backend writes it. A cash trip is confirmed with "I received the cash"; a
// Mercado Pago trip is charged with Checkout Pro (MercadoPagoCharge). The
// driver can also rate the passenger once (PassengerRating).
// It looks like an Uber receipt: a green check, the net earnings in big
// numbers, the route, duration, distance and payment, and the breakdown.
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FareBreakdown from "../../components/FareBreakdown";
import CashCharge from "../../components/CashCharge";
import MercadoPagoCharge from "../../components/MercadoPagoCharge";
import PassengerRating from "../../components/PassengerRating";
import PaymentStatusChip from "../../components/PaymentStatusChip";
import RouteStops from "../../components/RouteStops";
import Toast from "../../components/Toast";
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
import { tripChargeAmount } from "../../services/payments";
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

  // Floating notice after charging: { message, tone } or null
  const [toast, setToast] = useState(null);
  const hideToast = useCallback(() => setToast(null), []);
  const showPaymentResult = useCallback(
    (paymentStatus) => {
      if (paymentStatus === "approved") {
        setToast({ message: t("summary.toastApproved"), tone: "success" });
      } else if (paymentStatus === "rejected") {
        setToast({ message: t("summary.toastRejected"), tone: "error" });
      }
    },
    [t],
  );

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
  const canChargeMercadoPago =
    trip.paymentMethod === "mercadopago" && trip.status !== TRIP_STATUS.PAID;

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
          {/* Split payment: Mercado Pago already paid the driver's part */}
          {trip.paymentSplit === true && (
            <Text style={styles.caption}>{t("summary.paidSplit")}</Text>
          )}
        </View>

        {/* One "Collect" block with the button of the trip's method (the
            passenger chose it): cash or Mercado Pago (section 4) */}
        {(canConfirmCash || canChargeMercadoPago) && (
          <View style={styles.chargeCard}>
            <View style={styles.chargeHeader}>
              <Text style={styles.chargeTitle}>{t("summary.chargeTitle")}</Text>
              <Text style={styles.chargeAmount}>
                {formatCop(tripChargeAmount(trip))}
              </Text>
            </View>
            {canConfirmCash && (
              <CashCharge
                trip={trip}
                onPaid={() =>
                  setToast({ message: t("summary.toastCash"), tone: "success" })
                }
              />
            )}
            {canChargeMercadoPago && (
              <MercadoPagoCharge trip={trip} onResult={showPaymentResult} />
            )}
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

      {toast && (
        <Toast
          key={toast.message}
          message={toast.message}
          tone={toast.tone}
          top={insets.top}
          onHide={hideToast}
        />
      )}

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
  chargeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  chargeHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  chargeTitle: { ...typography.section, fontSize: 18 },
  chargeAmount: { ...typography.label, fontSize: 18 },
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
