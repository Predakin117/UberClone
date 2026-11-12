// AI-assisted: see docs/AI_LOG.md #6, #4, #21
// Viaje en curso (sección 3 del enunciado). El viaje viene de Firestore por
// TripContext y su status decide qué se muestra: hacia el punto de recogida
// (driver_arriving) o hacia el destino (in_progress).
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../contexts/TripContext";
import { advanceTrip, completeTrip } from "../../services/tripRepository";
import { hasRealRoute, routeCoordinates } from "../../services/tripRoute";
import { completionFields, TRIP_STATUS } from "../../services/trips";

const MAP_PADDING = { top: 80, right: 50, bottom: 300, left: 50 };

export default function ActiveTripScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { trip, isLoading } = useTrip();
  const mapRef = useRef(null);
  // Evita volver al inicio mientras se abre el resumen del viaje terminado
  const isFinishing = useRef(false);
  const advancedTripId = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // La ruta de OpenRouteService, o una línea recta si routePolyline es null
  const coordinates = useMemo(() => (trip ? routeCoordinates(trip) : []), [trip]);

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

  const fitRoute = useCallback(() => {
    if (coordinates.length < 2) return;
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: MAP_PADDING,
      animated: false,
    });
  }, [coordinates]);

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

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t("activeTrip.loading")}</Text>
      </View>
    );
  }

  const isInProgress = trip.status === TRIP_STATUS.IN_PROGRESS;
  const canAdvance =
    trip.status === TRIP_STATUS.DRIVER_ARRIVING || isInProgress;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        onMapReady={fitRoute}
        initialRegion={{
          latitude: trip.origin.lat,
          longitude: trip.origin.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={coordinates[0]}
          title={t("request.origin")}
          description={trip.origin.address}
          pinColor="green"
        />
        <Marker
          coordinate={coordinates[coordinates.length - 1]}
          title={t("request.destination")}
          description={trip.destination.address}
        />
        <Polyline
          coordinates={coordinates}
          strokeWidth={5}
          strokeColor="#1a56db"
          // La línea recta de respaldo va punteada: no es la ruta real
          lineDashPattern={hasRealRoute(trip) ? undefined : [10, 10]}
        />
      </MapView>

      <View style={styles.panel}>
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
        {!hasRealRoute(trip) && (
          <Text style={styles.hintText}>{t("activeTrip.straightLine")}</Text>
        )}

        {error && <Text style={styles.errorText}>{t(error)}</Text>}

        <TouchableOpacity
          style={[
            styles.button,
            isInProgress ? styles.btnFinish : styles.btnBoard,
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { fontSize: 18, color: "#555" },
  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
  },
  stepText: { fontSize: 14, color: "#666" },
  addressText: { fontSize: 20, fontWeight: "bold", marginVertical: 6 },
  detailText: { fontSize: 14, color: "#555", marginBottom: 8 },
  hintText: { fontSize: 12, color: "#888", marginBottom: 8 },
  errorText: { color: "red", fontSize: 13, marginBottom: 8 },
  button: {
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnBoard: { backgroundColor: "#FF9800" },
  btnFinish: { backgroundColor: "#F44336" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  cancelText: {
    color: "#F44336",
    textAlign: "center",
    marginTop: 14,
    fontSize: 15,
  },
});
