// AI-assisted: see docs/AI_LOG.md #6, #4, #21, #29, #31
// Viaje en curso (sección 3 del enunciado). El viaje viene de Firestore por
// TripContext y su status decide qué se muestra: la ruta hacia el punto de
// recogida (driver_arriving) o la ruta hacia el destino (in_progress).
// "Navigate" opens Google Maps towards the point of the current step. If the
// trip has passengerPhone, the passenger can be called or texted.
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import CarMarker from "../../components/CarMarker";
import {
  CONTROL_HEIGHT,
  colors,
  radius,
  spacing,
  typography,
} from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../contexts/TripContext";
import { useCarPosition } from "../../hooks/useCarPosition";
import { passengerContact } from "../../services/passengerContact";
import { advanceTrip, completeTrip } from "../../services/tripRepository";
import { navigationUrl, tripRoute } from "../../services/tripRoute";
import { completionFields, TRIP_STATUS } from "../../services/trips";

const MAP_PADDING = { top: 80, right: 50, bottom: 300, left: 50 };

export default function ActiveTripScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { trip, isLoading, pickupRoute } = useTrip();
  // The car on the map (read-only GPS; the home screen saves the location)
  const carPosition = useCarPosition();
  const mapRef = useRef(null);
  // Evita volver al inicio mientras se abre el resumen del viaje terminado
  const isFinishing = useRef(false);
  const advancedTripId = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const isInProgress = trip?.status === TRIP_STATUS.IN_PROGRESS;

  // Hacia el pasajero: la ruta desde el conductor (TripContext), o nada mientras
  // se calcula. Con el pasajero a bordo: la ruta del viaje. Las dos son líneas
  // rectas si OpenRouteService no respondió.
  const route = useMemo(() => {
    if (!trip) return null;
    return isInProgress ? tripRoute(trip) : pickupRoute;
  }, [trip, isInProgress, pickupRoute]);

  // Encuadra el mapa en la ruta que se muestra, y otra vez cuando cambia
  useEffect(() => {
    if (!isMapReady || !route || route.coordinates.length < 2) return;
    mapRef.current?.fitToCoordinates(route.coordinates, {
      edgePadding: MAP_PADDING,
      animated: true,
    });
  }, [isMapReady, route]);

  // Al aceptar, el viaje queda "accepted": el conductor ya va por el pasajero
  useEffect(() => {
    if (trip?.status !== TRIP_STATUS.ACCEPTED) return;
    if (advancedTripId.current === trip.id) return;
    advancedTripId.current = trip.id;
    advanceTrip(trip, TRIP_STATUS.DRIVER_ARRIVING).catch((advanceError) => {
      console.error("Error iniciando el viaje:", advanceError.cause ?? advanceError);
      setError(advanceError.code ?? "trip.error.failed");
    });
  }, [trip]);

  // Sin viaje en curso (cancelado o terminado) se vuelve al inicio
  useEffect(() => {
    if (isLoading || trip || isFinishing.current) return;
    navigation.popToTop();
  }, [isLoading, trip, navigation]);

  // "Pasajero a bordo" pasa a in_progress; "Finalizar viaje" cierra con los
  // montos de calculateFare y abre el resumen
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
      console.error("Error avanzando el viaje:", nextError.cause ?? nextError);
      setError(nextError.code ?? "trip.error.failed");
      setIsSending(false);
    }
  }, [trip, navigation]);

  // Cancelar solo se puede antes de que el pasajero suba (sección 3)
  const handleCancel = useCallback(async () => {
    if (!trip) return;
    setIsSending(true);
    setError(null);
    try {
      await advanceTrip(trip, TRIP_STATUS.CANCELLED);
    } catch (cancelError) {
      console.error("Error cancelando el viaje:", cancelError.cause ?? cancelError);
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
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
            // La línea recta de respaldo va punteada: no es la ruta real
            lineDashPattern={route.isReal ? undefined : [10, 10]}
          />
        )}
        <CarMarker position={carPosition} />
      </MapView>

      <View style={styles.panel}>
        {contact && (
          <View style={styles.passengerRow}>
            <Text style={styles.passengerName} numberOfLines={1}>
              {contact.name ?? t("activeTrip.passenger")}
            </Text>
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
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.black} />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.stepText}>
          {isInProgress
            ? t("activeTrip.goingToDestination")
            : t("activeTrip.goingToPickup")}
        </Text>
        <Text style={styles.addressText}>
          {isInProgress ? trip.destination.address : trip.origin.address}
        </Text>
        <Text style={styles.detailText}>
          {t("request.km").replace("{km}", trip.distanceKm)} ·{" "}
          {t("request.minutes").replace("{minutes}", trip.durationMin)} ·{" "}
          {t(`category.${trip.category}`)} · {t(`payment.${trip.paymentMethod}`)}
        </Text>
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

        {canAdvance && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={handleNavigate}
            accessibilityRole="link"
          >
            <Text style={styles.navigateText}>{t("activeTrip.navigate")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!canAdvance || isSending) && styles.disabled,
          ]}
          onPress={handleNext}
          disabled={!canAdvance || isSending}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {isInProgress
              ? t("activeTrip.finish")
              : t("activeTrip.passengerOnBoard")}
          </Text>
        </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { ...typography.subtitle },
  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: colors.background,
    padding: spacing.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
  },
  // Passenger's name with round call and message buttons
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  passengerName: { ...typography.label, fontSize: 16, flex: 1 },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { ...typography.caption, fontSize: 14 },
  addressText: { ...typography.section, marginVertical: spacing.xs + 2 },
  detailText: {
    ...typography.caption,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  hintText: { ...typography.caption, fontSize: 12, marginBottom: spacing.sm },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  // Secondary button: outlined pill
  navigateButton: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  navigateText: { ...typography.label, fontSize: 16 },
  // Main button: black with white text
  button: {
    minHeight: CONTROL_HEIGHT + 4,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 18 },
  cancelText: {
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.md + 2,
    fontSize: 15,
    fontWeight: "600",
  },
});
