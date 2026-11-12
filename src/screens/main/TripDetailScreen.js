// AI-assisted: see docs/AI_LOG.md #60
// Details of a finished trip (section 6), opened from the history: the route
// drawn on the map from the saved polyline (no new route request, section 7),
// the date, the net earnings, duration, distance, the fare breakdown with
// commission and tip, the payment status and the ratings. The trip is read in
// real time, so a payment confirmed later shows up here too.
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import PaymentStatusChip from "../../components/PaymentStatusChip";
import RouteStops from "../../components/RouteStops";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNightMap } from "../../hooks/useNightMap";
import { useTrip } from "../../hooks/useTrip";
import { formatCop, formatDateTime } from "../../i18n/format";
import { completedAtMillis } from "../../services/earnings";
import { tripRoute } from "../../services/tripRoute";

const MAP_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

// Five stars, filled up to `rating`
const Stars = ({ rating }) => (
  <View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? "star" : "star-outline"}
        size={16}
        color={colors.black}
      />
    ))}
  </View>
);

const Stat = ({ icon, label, value }) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={20} color={colors.black} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.caption}>{label}</Text>
  </View>
);

const AmountRow = ({ label, value, isTotal = false }) => (
  <View style={[styles.amountRow, isTotal && styles.totalRow]}>
    <Text style={isTotal ? styles.totalLabel : styles.amountLabel}>
      {label}
    </Text>
    <Text style={isTotal ? styles.totalValue : styles.amountValue}>
      {value}
    </Text>
  </View>
);

export default function TripDetailScreen() {
  const { tripId } = useRoute().params;
  const { t, language } = useLanguage();
  const { trip, error } = useTrip(tripId);
  const nightMap = useNightMap();
  const mapRef = useRef(null);
  const route = useMemo(() => (trip ? tripRoute(trip) : null), [trip]);

  if (!trip) {
    return (
      <View style={styles.loading}>
        {!error && <ActivityIndicator color={colors.black} />}
        <Text style={[styles.loadingText, error && styles.errorText]}>
          {error ? t(error) : t("tripDetail.loading")}
        </Text>
      </View>
    );
  }

  const ratingRow = (label, rating) => (
    <View style={styles.amountRow}>
      <Text style={styles.amountLabel}>{label}</Text>
      {Number.isInteger(rating) ? (
        <Stars rating={rating} />
      ) : (
        <Text style={styles.caption}>{t("tripDetail.notRated")}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <MapView
        ref={mapRef}
        style={styles.map}
        {...nightMap}
        // The whole route fits on the map once it's ready
        onMapReady={() =>
          mapRef.current?.fitToCoordinates(route.coordinates, {
            edgePadding: MAP_PADDING,
            animated: false,
          })
        }
        initialRegion={{
          latitude: trip.origin.lat,
          longitude: trip.origin.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        toolbarEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }}
          title={t("request.origin")}
          pinColor={colors.success}
        />
        <Marker
          coordinate={{
            latitude: trip.destination.lat,
            longitude: trip.destination.lng,
          }}
          title={t("request.destination")}
        />
        <Polyline
          coordinates={route.coordinates}
          strokeWidth={4}
          strokeColor={colors.black}
          // Dashed when it's the straight line, not the real route
          lineDashPattern={route.isReal ? undefined : [10, 10]}
        />
      </MapView>

      <View style={styles.body}>
        <Text style={styles.caption}>
          {formatDateTime(completedAtMillis(trip), language)} ·{" "}
          {t(`category.${trip.category}`)}
        </Text>
        <Text style={styles.earnedLabel}>{t("tripDetail.earned")}</Text>
        <Text style={styles.earned}>{formatCop(trip.driverEarnings)}</Text>
        <PaymentStatusChip trip={trip} />

        <View style={styles.section}>
          <RouteStops
            origin={trip.origin.address}
            destination={trip.destination.address}
            originLabel={t("request.origin")}
            destinationLabel={t("request.destination")}
            numberOfLines={2}
          />
          {!route.isReal && (
            <Text style={[styles.caption, styles.note]}>
              {t("tripDetail.approxRoute")}
            </Text>
          )}
        </View>

        <View style={styles.stats}>
          <Stat
            icon="time-outline"
            label={t("request.duration")}
            value={t("request.minutes").replace("{minutes}", trip.durationMin)}
          />
          <Stat
            icon="navigate-outline"
            label={t("request.distance")}
            value={t("request.km").replace("{km}", trip.distanceKm)}
          />
          <Stat
            icon={
              trip.paymentMethod === "cash" ? "cash-outline" : "card-outline"
            }
            label={t("summary.payment")}
            value={t(`payment.${trip.paymentMethod}`)}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("tripDetail.breakdown")}</Text>
        <View style={styles.card}>
          <AmountRow label={t("summary.fare")} value={formatCop(trip.fare)} />
          <AmountRow
            label={t("summary.commission").replace(
              "{percent}",
              Math.round(trip.commissionRate * 100),
            )}
            value={`- ${formatCop(trip.commission)}`}
          />
          <AmountRow
            label={t("summary.tip")}
            value={`+ ${formatCop(trip.tip ?? 0)}`}
          />
          <AmountRow
            label={t("summary.earnings")}
            value={formatCop(trip.driverEarnings)}
            isTotal
          />
        </View>

        <Text style={styles.sectionTitle}>{t("tripDetail.ratings")}</Text>
        <View style={styles.card}>
          {ratingRow(t("tripDetail.riderRatedYou"), trip.rating)}
          {ratingRow(t("tripDetail.youRatedRider"), trip.passengerRating)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  loadingText: { ...typography.subtitle, textAlign: "center" },
  errorText: { color: colors.error },
  map: { height: 260 },
  body: { padding: spacing.xl - 4, gap: spacing.sm },
  caption: typography.caption,
  earnedLabel: { ...typography.label, marginTop: spacing.sm },
  earned: { fontSize: 36, fontWeight: "700", color: colors.textPrimary },
  section: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  note: { marginTop: spacing.md },
  stats: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  statValue: { ...typography.label, fontSize: 15, marginTop: spacing.xs },
  sectionTitle: { ...typography.section, fontSize: 18, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  amountLabel: { ...typography.body, fontSize: 15, flexShrink: 1 },
  amountValue: { ...typography.body, fontSize: 15 },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  totalLabel: { ...typography.label, fontSize: 16, flexShrink: 1 },
  totalValue: { fontSize: 17, fontWeight: "700", color: colors.success },
  stars: { flexDirection: "row", gap: 2 },
});
