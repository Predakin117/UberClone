// AI-assisted: see docs/AI_LOG.md #4, #21, #29, #31, #59
// New request card (section 3 of the project statement). HomeScreen shows it
// on the map with the oldest request and the seconds left to answer; the
// timer lives in useTripRequests. The countdown is also a
// bar that shrinks from 15 to 0 seconds. On top, the straight-line time and
// distance to the pickup point (no OpenRouteService call here, section 7).
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { calculateFare } from "../config/pricing";
import {
  CONTROL_HEIGHT,
  colors,
  radius,
  spacing,
  typography,
} from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { REQUEST_SECONDS } from "../hooks/useTripRequests";
import { formatDecimal } from "../i18n/format";
import { pickupEstimate } from "../services/pickupEstimate";
import { respondToRequest } from "../services/tripRepository";
import { TRIP_STATUS } from "../services/trips";

const formatCop = (amount) => `$${amount.toLocaleString("es-CO")} COP`;

// AI-assisted: see docs/AI_LOG.md #59
// Two long pulses, like Uber, so the driver notices the request without
// looking at the phone. On Android: wait, vibrate, pause, vibrate (ms).
// iOS ignores the durations and vibrates once.
const NEW_REQUEST_VIBRATION = [0, 500, 250, 500];

export default function IncomingRequestCard({
  trip,
  timeLeft,
  driverStatus,
  driverLocation,
}) {
  const { t, language } = useLanguage();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  // Share of the time left, from 1 (15 s) to 0. Each second it slides to the
  // next value, so the bar shrinks smoothly instead of jumping.
  const [progress] = useState(
    () => new Animated.Value(Math.min(timeLeft / REQUEST_SECONDS, 1)),
  );

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: Math.max(timeLeft - 1, 0) / REQUEST_SECONDS,
      duration: timeLeft > 0 ? 1000 : 0,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [timeLeft, progress]);

  // AI-assisted: see docs/AI_LOG.md #59
  // HomeScreen gives the card the trip id as key, so it mounts again with
  // each new request and vibrates once per request. If the card goes away
  // first (accepted, declined or timed out), the vibration stops.
  useEffect(() => {
    Vibration.vibrate(NEW_REQUEST_VIBRATION);
    return () => Vibration.cancel();
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Straight line from the driver to the pickup point; null without location
  const toPickup = useMemo(
    () => pickupEstimate(driverLocation, trip.origin),
    [driverLocation, trip.origin],
  );

  // The same function that closes the trip, so the estimate matches the
  // charge. An unknown category gives no estimate.
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

  // Accepting doesn't navigate from here: the trip becomes "accepted" in
  // Firestore and HomeScreen takes the driver to the trip from that status
  const handleAccept = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      await respondToRequest(trip.id, TRIP_STATUS.ACCEPTED, driverStatus);
    } catch (acceptError) {
      console.error("Error accepting the request:", acceptError.cause ?? acceptError);
      setError(acceptError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip.id, driverStatus]);

  // Declining removes the request from the list and HomeScreen stops showing it
  const handleReject = useCallback(async () => {
    setIsSending(true);
    setError(null);
    try {
      await respondToRequest(trip.id, TRIP_STATUS.REJECTED, driverStatus);
    } catch (rejectError) {
      console.error("Error declining the request:", rejectError.cause ?? rejectError);
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
        <TouchableOpacity
          style={[styles.rejectButton, isSending && styles.disabled]}
          onPress={handleReject}
          disabled={isSending}
          hitSlop={spacing.md}
          accessibilityRole="button"
          accessibilityLabel={t("request.reject")}
        >
          <View style={[styles.crossBar, styles.crossForward]} />
          <View style={[styles.crossBar, styles.crossBack]} />
        </TouchableOpacity>

        {toPickup && (
          <Text style={styles.pickupText}>
            {t("request.pickupEstimate")
              .replace("{minutes}", toPickup.minutes)
              .replace("{km}", formatDecimal(toPickup.km, language))}
          </Text>
        )}
        <Text style={styles.title}>{t("request.title")}</Text>

        <View style={styles.timerRow}>
          <View
            style={styles.timerTrack}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: REQUEST_SECONDS, now: timeLeft }}
          >
            <Animated.View style={[styles.timerFill, { width: barWidth }]} />
          </View>
          <Text style={styles.timerText}>
            {t("request.seconds").replace("{seconds}", timeLeft)}
          </Text>
        </View>

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
                <Text style={[styles.value, styles.money]}>
                  {formatCop(estimate.fare)}
                </Text>
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

        <TouchableOpacity
          style={[styles.acceptButton, isSending && styles.disabled]}
          onPress={handleAccept}
          disabled={isSending}
          accessibilityRole="button"
        >
          <Text style={styles.acceptText}>{t("request.accept")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CROSS_SIZE = 14;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    padding: spacing.xl - 4,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.xl,
    elevation: 10,
  },
  // Discreet X in the top right corner to decline
  rejectButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  crossBar: {
    position: "absolute",
    width: CROSS_SIZE,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textSecondary,
  },
  crossForward: { transform: [{ rotate: "45deg" }] },
  crossBack: { transform: [{ rotate: "-45deg" }] },
  pickupText: {
    ...typography.label,
    fontSize: 16,
    marginBottom: spacing.xs,
    paddingRight: 40,
  },
  title: { ...typography.section, marginBottom: spacing.md, paddingRight: 40 },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl - 4,
  },
  timerTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  timerText: { ...typography.label, minWidth: 36, textAlign: "right" },
  infoContainer: { marginBottom: spacing.xl - 4, gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { ...typography.caption, fontSize: 14 },
  value: { ...typography.body, fontSize: 14, flex: 1, textAlign: "right" },
  money: { color: colors.success, fontWeight: "600" },
  earningsText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.success,
    textAlign: "right",
  },
  errorText: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
  acceptButton: {
    minHeight: CONTROL_HEIGHT + 4,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
