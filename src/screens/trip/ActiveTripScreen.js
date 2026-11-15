// AI-assisted: see docs/AI_LOG.md #6, #4, #21, #29, #31
// Current trip (section 3 of the project statement). The trip comes from
// Firestore through TripContext and its status decides what is shown: the
// route to the pickup point (driver_arriving) or to the destination
// (in_progress).
// "Navigate" opens Google Maps towards the point of the current step. If the
// trip has passengerPhone, the passenger can be called or texted.
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CarMarker from "../../components/CarMarker";
import SwipeButton from "../../components/SwipeButton";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../contexts/TripContext";
import { useCarPosition } from "../../hooks/useCarPosition";
import { useNightMap } from "../../hooks/useNightMap";
import { passengerContact } from "../../services/passengerContact";
import { advanceTrip, completeTrip } from "../../services/tripRepository";
import { navigationUrl, tripRoute } from "../../services/tripRoute";
import { completionFields, TRIP_STATUS } from "../../services/trips";

// Room for the banner on top and the sheet at the bottom
const MAP_PADDING = { top: 180, right: 50, bottom: 340, left: 50 };

export default function ActiveTripScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { trip, isLoading, pickupRoute } = useTrip();
  const insets = useSafeAreaInsets();
  // The car on the map (read-only GPS; the home screen saves the location)
  const carPosition = useCarPosition();
  // Dark map between 6 p.m. and 6 a.m.
  const nightMap = useNightMap();
  const mapRef = useRef(null);
  // Keeps it from going back home while the summary of the finished trip opens
  const isFinishing = useRef(false);
  const advancedTripId = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const isInProgress = trip?.status === TRIP_STATUS.IN_PROGRESS;

  // To the passenger: the route from the driver (TripContext), or nothing
  // while it's calculated. With the passenger on board: the trip route. Both
  // are straight lines if OpenRouteService didn't answer.
  const route = useMemo(() => {
    if (!trip) return null;
    return isInProgress ? tripRoute(trip) : pickupRoute;
  }, [trip, isInProgress, pickupRoute]);

  // Fits the map to the route shown, and again when it changes
  useEffect(() => {
    if (!isMapReady || !route || route.coordinates.length < 2) return;
    mapRef.current?.fitToCoordinates(route.coordinates, {
      edgePadding: MAP_PADDING,
      animated: true,
    });
  }, [isMapReady, route]);

  // Once accepted, the trip is "accepted": the driver is already on the way
  useEffect(() => {
    if (trip?.status !== TRIP_STATUS.ACCEPTED) return;
    if (advancedTripId.current === trip.id) return;
    advancedTripId.current = trip.id;
    advanceTrip(trip, TRIP_STATUS.DRIVER_ARRIVING).catch((advanceError) => {
      console.error(
        "Error starting the trip:",
        advanceError.cause ?? advanceError,
      );
      setError(advanceError.code ?? "trip.error.failed");
    });
  }, [trip]);

  // Without a current trip (cancelled or finished) it goes back home
  useEffect(() => {
    if (isLoading || trip || isFinishing.current) return;
    navigation.popToTop();
  }, [isLoading, trip, navigation]);

  // "Passenger on board" moves to in_progress; "End trip" closes it with the
  // amounts of calculateFare and opens the summary
  const handleNext = useCallback(async () => {
    if (!trip) return;
    setIsSending(true);
    setError(null);
    try {
      if (trip.status === TRIP_STATUS.DRIVER_ARRIVING) {
        await advanceTrip(trip, TRIP_STATUS.IN_PROGRESS);
        setIsSending(false);
      } else if (trip.status === TRIP_STATUS.IN_PROGRESS) {
        isFinishing.current = true;
        await completeTrip(trip);
        navigation.replace("TripSummary", {
          trip: { ...trip, ...completionFields(trip) },
        });
      }
    } catch (nextError) {
      isFinishing.current = false;
      console.error("Error advancing the trip:", nextError.cause ?? nextError);
      setError(nextError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip, navigation]);

  // Cancelling is only possible before the passenger gets in (section 3)
  const handleCancel = useCallback(async () => {
    if (!trip) return;
    setIsSending(true);
    setError(null);
    try {
      await advanceTrip(trip, TRIP_STATUS.CANCELLED);
    } catch (cancelError) {
      console.error(
        "Error cancelling the trip:",
        cancelError.cause ?? cancelError,
      );
      setError(cancelError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip]);

  // Opens Google Maps (app or browser) with directions to the current stop
  const handleNavigate = useCallback(async () => {
    const url = navigationUrl(trip);
    if (!url) return;
    setError(null);
    try {
      await Linking.openURL(url);
    } catch (navigateError) {
      console.warn("Could not open Google Maps:", navigateError);
      setError("activeTrip.navigateFailed");
    }
  }, [trip]);

  // Opens the phone or the messages app with the passenger's number
  const openContact = useCallback(async (url) => {
    setError(null);
    try {
      await Linking.openURL(url);
    } catch (contactError) {
      console.warn("Could not contact the passenger:", contactError);
      setError("activeTrip.contactFailed");
    }
  }, []);

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t("activeTrip.loading")}</Text>
      </View>
    );
  }

  const canAdvance =
    trip.status === TRIP_STATUS.DRIVER_ARRIVING || isInProgress;
  const contact = passengerContact(trip);
  const passengerName = contact?.name ?? t("activeTrip.passenger");

  // AI-assisted: see docs/AI_LOG.md #60
  // Only the look changes, like Uber: a black banner on top with the current
  // stop and "Navigate", and a bottom sheet with the passenger and a swipe
  // button to start or end the trip, so a tap by accident does nothing
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        {...nightMap}
        onMapReady={() => setIsMapReady(true)}
        initialRegion={{
          latitude: trip.origin.lat,
          longitude: trip.origin.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }}
          title={t("request.origin")}
          description={trip.origin.address}
          // Android pins only take a hue (black would turn red): the theme's
          // green tells the pickup apart from the destination
          pinColor={colors.success}
        />
        {isInProgress && (
          <Marker
            coordinate={{
              latitude: trip.destination.lat,
              longitude: trip.destination.lng,
            }}
            title={t("request.destination")}
            description={trip.destination.address}
          />
        )}
        {route?.coordinates.length >= 2 && (
          <Polyline
            coordinates={route.coordinates}
            strokeWidth={5}
            strokeColor={colors.black}
            // The fallback straight line is dashed: it isn't the real route
            lineDashPattern={route.isReal ? undefined : [10, 10]}
          />
        )}
        <CarMarker position={carPosition} />
      </MapView>

      {/* Black banner: where to go now, and Navigate */}
      <View style={[styles.banner, { top: insets.top + spacing.sm }]}>
        <View style={styles.bannerIcon}>
          <Ionicons
            name={isInProgress ? "flag" : "person"}
            size={20}
            color={colors.white}
          />
        </View>
        <View style={styles.bannerTexts}>
          <Text style={styles.bannerStep}>
            {isInProgress
              ? t("activeTrip.goingToDestination")
              : t("activeTrip.goingToPickup")}
          </Text>
          <Text style={styles.bannerAddress} numberOfLines={2}>
            {isInProgress ? trip.destination.address : trip.origin.address}
          </Text>
        </View>
        {canAdvance && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={handleNavigate}
            accessibilityRole="link"
            accessibilityLabel={t("activeTrip.navigate")}
          >
            <Ionicons name="navigate" size={18} color={colors.black} />
            <Text style={styles.navigateText}>{t("activeTrip.navigate")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
      >
        <View style={styles.handle} />

        {/* The passenger, with round call and message buttons */}
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {passengerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.passengerTexts}>
            <Text style={styles.passengerName} numberOfLines={1}>
              {passengerName}
            </Text>
            <Text style={styles.caption} numberOfLines={1}>
              {t(`category.${trip.category}`)} ·{" "}
              {t(`payment.${trip.paymentMethod}`)}
            </Text>
          </View>
          {contact && (
            <>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => openContact(contact.callUrl)}
                accessibilityRole="button"
                accessibilityLabel={t("activeTrip.call")}
              >
                <Ionicons name="call" size={20} color={colors.black} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => openContact(contact.smsUrl)}
                accessibilityRole="button"
                accessibilityLabel={t("activeTrip.message")}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color={colors.black}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.tripStats}>
          <View style={styles.tripStat}>
            <Ionicons name="time-outline" size={18} color={colors.black} />
            <Text style={styles.tripStatText}>
              {t("request.minutes").replace("{minutes}", trip.durationMin)}
            </Text>
          </View>
          <View style={styles.tripStat}>
            <Ionicons name="navigate-outline" size={18} color={colors.black} />
            <Text style={styles.tripStatText}>
              {t("request.km").replace("{km}", trip.distanceKm)}
            </Text>
          </View>
        </View>

        {!route && (
          <Text style={styles.hintText}>{t("activeTrip.loadingRoute")}</Text>
        )}
        {route?.coordinates.length === 0 && (
          <Text style={styles.hintText}>{t("activeTrip.noLocation")}</Text>
        )}
        {route?.coordinates.length >= 2 && !route.isReal && (
          <Text style={styles.hintText}>{t("activeTrip.straightLine")}</Text>
        )}
        {error && <Text style={styles.errorText}>{t(error)}</Text>}

        <SwipeButton
          label={
            isInProgress
              ? t("activeTrip.swipeFinish")
              : t("activeTrip.swipeStart")
          }
          onComplete={handleNext}
          // Ending the trip is red, like Uber
          color={isInProgress ? colors.error : colors.black}
          disabled={!canAdvance}
          isLoading={isSending}
        />

        {!isInProgress && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={isSending}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>{t("activeTrip.cancel")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const AVATAR_SIZE = 48;

const shadow = {
  shadowColor: colors.black,
  shadowOpacity: 0.2,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 8,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { ...typography.subtitle },
  banner: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTexts: { flex: 1, gap: 2 },
  bannerStep: { fontSize: 13, color: colors.textOnDark },
  bannerAddress: { fontSize: 17, fontWeight: "700", color: colors.white },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  navigateText: { ...typography.label },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl - 4,
    paddingTop: spacing.sm,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
    ...shadow,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  passengerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: "700" },
  passengerTexts: { flex: 1, gap: 2 },
  passengerName: { ...typography.label, fontSize: 17 },
  caption: typography.caption,
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tripStats: { flexDirection: "row", gap: spacing.sm },
  tripStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  tripStatText: { ...typography.label },
  hintText: { ...typography.caption, fontSize: 12 },
  errorText: { ...typography.caption, color: colors.error },
  cancelText: {
    color: colors.error,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: spacing.xs,
  },
});
