// AI-assisted: see docs/AI_LOG.md #6, #4, #16, #17, #21, #27, #57, #31
// src/screens/trip/HomeScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CarMarker from "../../components/CarMarker";
import IncomingRequestCard from "../../components/IncomingRequestCard";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrip } from "../../contexts/TripContext";
import { useDriverLocation } from "../../hooks/useDriverLocation";
import { useEarnings } from "../../hooks/useEarnings";
import { useEarningsTrips } from "../../hooks/useEarningsTrips";
import { useDriverStatus } from "../../hooks/useDriverStatus";
import { useTripRequests } from "../../hooks/useTripRequests";
import { formatCop } from "../../i18n/format";
import {
  canReceiveRequests,
  getAvailabilityBlock,
} from "../../services/driverStatus";

// REGLA: AsyncStorage guarda el último estado de disponibilidad
const AVAILABILITY_KEY = "@driver_availability";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const activeTrip = useTrip();
  const activeTripId = activeTrip.trip?.id ?? null;
  // AI-assisted: see docs/AI_LOG.md #31
  // Today's net earnings for the pill on top, the same as the earnings screen
  const { trips: earningsTrips } = useEarningsTrips();
  const todayEarnings = useEarnings(earningsTrips).today.netEarnings;

  // Solo un conductor aprobado puede ponerse Disponible (sección 2 del enunciado).
  // Si la cuenta no está aprobada queda desconectado, aunque la última vez quedara conectado.
  const driverState = useDriverStatus();
  const blockKey = getAvailabilityBlock(driverState);
  const canGoOnline = blockKey === null;
  const isActive = isOnline && canGoOnline;

  // El rastreo de ubicación solo corre mientras el conductor está conectado. Con
  // un viaje en curso sigue guardando la ubicación, pero queda no disponible.
  const { location, errorMsg } = useDriverLocation(
    isActive,
    Boolean(activeTrip.trip),
  );

  // Solicitudes nuevas: solo conectado, aprobado y sin viaje en curso. Este inicio
  // sigue montado debajo del viaje, así que sin esta condición rechazaría
  // solicitudes que el conductor no ve.
  const {
    request,
    timeLeft,
    error: requestsError,
  } = useTripRequests(
    canReceiveRequests({ isActive, activeTrip }),
    driverState.status,
  );

  // El status del viaje en Firestore controla la pantalla (sección 3): con un
  // viaje en curso se va a él, también al reabrir la app
  useEffect(() => {
    if (activeTripId) navigation.navigate("ActiveTrip");
  }, [activeTripId, navigation]);

  useEffect(() => {
    AsyncStorage.getItem(AVAILABILITY_KEY)
      .then((stored) => {
        if (stored !== null) setIsOnline(stored === "true");
      })
      .catch((error) =>
        console.error("Error leyendo la disponibilidad:", error),
      );
  }, []);

  // Centra el mapa en el conductor sin bloquear el desplazamiento manual
  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    );
  }, [location]);

  const toggleOnline = () => {
    if (!canGoOnline) return;
    const next = !isActive;
    setIsOnline(next);
    AsyncStorage.setItem(AVAILABILITY_KEY, String(next)).catch((error) =>
      console.error("Error guardando la disponibilidad:", error),
    );
  };

  // AI-assisted: see docs/AI_LOG.md #57
  // Only the look changes: full-screen map, round menu button, status chip on
  // top and a bottom sheet with the Available / Unavailable switch
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: 6.2442,
          longitude: -75.5812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* The car replaces the blue dot while the driver is online */}
        {isActive && <CarMarker position={location} />}
      </MapView>

      {/* Barra superior: menú y estado */}
      <View style={[styles.topBar, { top: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityRole="button"
          accessibilityLabel={t("home.openMenu")}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <View style={styles.statusChip}>
          <View
            style={[styles.statusDot, isActive && styles.statusDotOnline]}
          />
          <Text style={styles.statusChipText}>
            {isActive ? t("home.available") : t("home.unavailable")}
          </Text>
        </View>

        {/* Mismo ancho que el botón del menú, para centrar el estado */}
        <View style={styles.menuSpacer} />
      </View>

      {/* Today's net earnings, under the status chip */}
      <View
        style={[styles.earningsPill, { top: insets.top + spacing.md + 60 }]}
        accessible
        accessibilityLabel={`${t("home.todayEarnings")} ${formatCop(todayEarnings)}`}
      >
        <Text style={styles.earningsLabel}>{t("home.todayEarnings")}</Text>
        <Text style={styles.earningsAmount}>{formatCop(todayEarnings)}</Text>
      </View>

      {/* Avisos: cuenta sin aprobar, ubicación y solicitudes */}
      <View
        style={[
          styles.notices,
          { top: insets.top + spacing.md + 60 + EARNINGS_PILL_SPACE },
        ]}
      >
        {blockKey && (
          <Text style={[styles.notice, styles.noticeInfo]}>{t(blockKey)}</Text>
        )}
        {errorMsg && (
          <Text style={[styles.notice, styles.noticeError]}>{errorMsg}</Text>
        )}
        {requestsError && (
          <Text style={[styles.notice, styles.noticeError]}>
            {t(requestsError)}
          </Text>
        )}
      </View>

      {/* Panel inferior con el interruptor Disponible / No disponible */}
      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
      >
        <View style={styles.handle} />

        {/* Si el conductor volvió al inicio con un viaje en curso */}
        {activeTripId && (
          <TouchableOpacity
            style={styles.backToTrip}
            onPress={() => navigation.navigate("ActiveTrip")}
            accessibilityRole="button"
          >
            <Text style={styles.backToTripText}>{t("home.backToTrip")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.switchRow, !canGoOnline && styles.blocked]}
          onPress={toggleOnline}
          disabled={!canGoOnline}
          activeOpacity={0.8}
          accessibilityRole="switch"
          accessibilityLabel={t("home.available")}
          accessibilityState={{ checked: isActive, disabled: !canGoOnline }}
        >
          <View style={styles.switchTexts}>
            <Text style={styles.sheetTitle}>
              {isActive ? t("home.onlineTitle") : t("home.offlineTitle")}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {isActive ? t("home.onlineSubtitle") : t("home.offlineSubtitle")}
            </Text>
          </View>
          <View style={[styles.track, isActive && styles.trackOn]}>
            <View style={[styles.thumb, isActive && styles.thumbOn]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* La solicitud más antigua, sobre el mapa. key la reinicia con cada solicitud */}
      {request && (
        <IncomingRequestCard
          key={request.id}
          trip={request}
          timeLeft={timeLeft}
          driverStatus={driverState.status}
          driverLocation={location}
        />
      )}
    </View>
  );
}

const MENU_SIZE = 48;
// Height of the earnings pill plus the gap below it
const EARNINGS_PILL_SPACE = 52;
const TRACK_WIDTH = 60;
const THUMB_SIZE = 28;
const TRACK_PADDING = 3;

const shadow = {
  shadowColor: colors.black,
  shadowOpacity: 0.15,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  topBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: MENU_SIZE,
    height: MENU_SIZE,
    borderRadius: MENU_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...shadow,
  },
  menuLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.black,
  },
  menuSpacer: { width: MENU_SIZE },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    ...shadow,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.placeholder,
  },
  statusDotOnline: { backgroundColor: colors.success },
  statusChipText: { fontSize: 15, fontWeight: "700", color: colors.black },

  earningsPill: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow,
  },
  earningsLabel: { ...typography.label, color: colors.disabledText },
  earningsAmount: { fontSize: 18, fontWeight: "700", color: colors.white },

  notices: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  notice: {
    backgroundColor: colors.white,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    overflow: "hidden",
    ...shadow,
  },
  noticeInfo: { borderLeftColor: colors.black },
  noticeError: { borderLeftColor: colors.error, color: colors.error },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl - 4,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    ...shadow,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  backToTrip: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  backToTripText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  blocked: { opacity: 0.5 },
  switchTexts: { flex: 1, gap: spacing.xs },
  sheetTitle: { ...typography.title, fontSize: 24 },
  sheetSubtitle: typography.caption,
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + TRACK_PADDING * 2,
    borderRadius: radius.pill,
    padding: TRACK_PADDING,
    backgroundColor: colors.border,
    justifyContent: "center",
  },
  trackOn: { backgroundColor: colors.success },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    ...shadow,
    elevation: 2,
  },
  thumbOn: {
    transform: [{ translateX: TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2 }],
  },
});
