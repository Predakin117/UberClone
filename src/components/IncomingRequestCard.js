// AI-assisted: see docs/AI_LOG.md #4, #21, #29, #31, #59, #64
// New request card (section 3 of the project statement). HomeScreen shows it
// on the map with the oldest request and the seconds left to answer; the
// timer lives in useTripRequests. The countdown is a ring around the accept
// button that empties from 15 to 0 seconds. It also shows the straight-line
// time and distance to the pickup point (no OpenRouteService call here,
// section 7).
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calculateFare } from "../config/pricing";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { REQUEST_SECONDS } from "../hooks/useTripRequests";
import { formatDecimal } from "../i18n/format";
import { pickupEstimate } from "../services/pickupEstimate";
import { respondToRequest } from "../services/tripRepository";
import { TRIP_STATUS } from "../services/trips";
import CountdownRing from "./CountdownRing";
import RouteStops from "./RouteStops";

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
  const insets = useSafeAreaInsets();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  // Share of the time left, from 1 (15 s) to 0. Each second it slides to the
  // next value, so the ring shrinks smoothly instead of jumping.
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

  // The card slides up from the bottom and the map darkens behind it, like
  // Uber's request
  const [appear] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.spring(appear, {
      toValue: 1,
      bounciness: 4,
      speed: 14,
      useNativeDriver: true,
    });
    animation.start();
    // Cleanup: stop the animation if the card goes away first
    return () => animation.stop();
  }, [appear]);
  const cardSlide = {
    transform: [
      {
        translateY: appear.interpolate({
          inputRange: [0, 1],
          outputRange: [SLIDE_DISTANCE, 0],
        }),
      },
    ],
  };

  // AI-assisted: see docs/AI_LOG.md #59
  // HomeScreen gives the card the trip id as key, so it mounts again with
  // each new request and vibrates once per request. If the card goes away
  // first (accepted, declined or timed out), the vibration stops.
  useEffect(() => {
    Vibration.vibrate(NEW_REQUEST_VIBRATION);
    return () => Vibration.cancel();
  }, []);

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
      console.error(
        "Error accepting the request:",
        acceptError.cause ?? acceptError,
      );
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
      console.error(
        "Error declining the request:",
        rejectError.cause ?? rejectError,
      );
      setError(rejectError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip.id, driverStatus]);

  // AI-assisted: see docs/AI_LOG.md #60
  // Only the look changes, like Uber: a sheet from the bottom with the
  // category, the fare in big numbers, the route and a round Accept button
  // with the time left as a ring around it. Every field of section 3 is still
  // here: origin, destination, distance, duration, category, payment method,
  // estimated fare and net earnings, and the 15-second timer.
  // Decline and Accept sit together at the bottom, within reach of the thumb;
  // the details scroll if the phone is small, so Accept is always on screen.
  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, { opacity: appear }]}
      />
      <Animated.View
        style={[
          styles.card,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
          cardSlide,
        ]}
      >
        <View style={styles.handle} />
        <ScrollView
          style={styles.details}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View style={styles.categoryTag}>
              <Ionicons name="car" size={14} color={colors.white} />
              <Text style={styles.categoryText}>
                {t(`category.${trip.category}`)}
              </Text>
            </View>
            <View style={styles.paymentTag}>
              <Ionicons
                name={
                  trip.paymentMethod === "cash"
                    ? "cash-outline"
                    : "card-outline"
                }
                size={14}
                color={colors.black}
              />
              <Text style={styles.paymentText}>
                {t(`payment.${trip.paymentMethod}`)}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{t("request.title")}</Text>
          {estimate && (
            <>
              <Text
                style={styles.fare}
                accessibilityLabel={`${t("request.fare")} ${formatCop(estimate.fare)}`}
              >
                {formatCop(estimate.fare)}
              </Text>
              <Text style={styles.earnings}>
                {t("request.earnings")}: {formatCop(estimate.driverEarnings)}
              </Text>
            </>
          )}

          {toPickup && (
            <View style={styles.pickupRow}>
              <Ionicons name="person-outline" size={16} color={colors.black} />
              <Text style={styles.pickupText}>
                {t("request.pickupEstimate")
                  .replace("{minutes}", toPickup.minutes)
                  .replace("{km}", formatDecimal(toPickup.km, language))}
              </Text>
            </View>
          )}

          <View style={styles.route}>
            <RouteStops
              origin={trip.origin?.address}
              destination={trip.destination?.address}
              originLabel={t("request.origin")}
              destinationLabel={t("request.destination")}
            />
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons
                name="navigate-outline"
                size={16}
                color={colors.black}
              />
              <Text style={styles.statText}>
                {t("request.distance")}:{" "}
                {t("request.km").replace("{km}", trip.distanceKm)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color={colors.black} />
              <Text style={styles.statText}>
                {t("request.duration")}:{" "}
                {t("request.minutes").replace("{minutes}", trip.durationMin)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {error && <Text style={styles.errorText}>{t(error)}</Text>}

        {/* The round Accept in the middle with the time left as a ring
            around it, and a wide Decline button right under it */}
        <View style={styles.actions}>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: REQUEST_SECONDS, now: timeLeft }}
          >
            <CountdownRing progress={progress} size={RING_SIZE} strokeWidth={6}>
              <TouchableOpacity
                style={[styles.acceptButton, isSending && styles.disabled]}
                onPress={handleAccept}
                disabled={isSending}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.acceptText}>{t("request.accept")}</Text>
                <Text style={styles.secondsText}>
                  {t("request.seconds").replace("{seconds}", timeLeft)}
                </Text>
              </TouchableOpacity>
            </CountdownRing>
          </View>

          <TouchableOpacity
            style={[styles.rejectButton, isSending && styles.disabled]}
            onPress={handleReject}
            disabled={isSending}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Ionicons name="close" size={22} color={colors.black} />
            <Text style={styles.rejectText}>{t("request.reject")}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const RING_SIZE = 116;
const ACCEPT_SIZE = RING_SIZE - 22;
// How far below its place the card starts its slide up
const SLIDE_DISTANCE = 500;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
  },
  card: {
    maxHeight: "92%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl - 4,
    paddingTop: spacing.sm,
    elevation: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  // The details shrink and scroll; the actions below never move
  details: { flexGrow: 0, flexShrink: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  categoryText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  paymentTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  paymentText: { ...typography.label, fontSize: 13 },
  title: { ...typography.caption, fontSize: 14, marginTop: spacing.md },
  fare: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  earnings: { fontSize: 16, fontWeight: "700", color: colors.success },
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  pickupText: { ...typography.label, fontSize: 15 },
  route: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  statText: { ...typography.label, fontSize: 13 },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: "center",
  },
  actions: {
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  // Decline: a wide outlined button, easy to find but apart from Accept
  rejectButton: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rejectText: { ...typography.label, fontSize: 16 },
  acceptButton: {
    width: ACCEPT_SIZE,
    height: ACCEPT_SIZE,
    borderRadius: ACCEPT_SIZE / 2,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  secondsText: { color: colors.textOnDark, fontSize: 13, marginTop: 2 },
  disabled: { opacity: 0.6 },
});
