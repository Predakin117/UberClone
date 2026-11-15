// AI-assisted: see docs/AI_LOG.md #28, #60, #61
// Trip history of the driver (section 6): the finished trips (completed or
// paid) in real time, newest first, 20 per load. Filters: today, this week,
// this month or a date range, and the payment method. Trips are grouped by
// day like Uber, and tapping one opens its details (TripDetailScreen).
// While the first trips load, gray rows in the shape of the list.
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateField from "../../components/DateField";
import PaymentStatusChip from "../../components/PaymentStatusChip";
import RouteStops from "../../components/RouteStops";
import Skeleton, { SkeletonBox } from "../../components/Skeleton";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTripHistory } from "../../hooks/useTripHistory";
import { formatCop, formatDay, formatTime } from "../../i18n/format";
import {
  completedAtMillis,
  filterTripsByPeriod,
  summarizeTrips,
} from "../../services/earnings";
import {
  filterTripsByDateRange,
  filterTripsByPaymentMethod,
  groupTripsByDay,
  HISTORY_PERIODS,
  PAYMENT_FILTERS,
  relativeDay,
} from "../../services/historyFilters";
import { validateDateRange } from "../../validation/dateRange";
import { toISODate } from "../../validation/dates";

// The custom range starts as this month up to today
const defaultRange = () => {
  const today = new Date();
  return {
    from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toISODate(today),
  };
};

const FilterChip = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipSelected]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: isSelected }}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const TripItem = ({ trip, onPress }) => {
  const { t, language } = useLanguage();
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityHint={t("history.openTrip")}
    >
      <View style={styles.itemTop}>
        <Text style={styles.time}>
          {formatTime(completedAtMillis(trip), language)}
        </Text>
        <Text style={styles.itemEarnings}>
          {formatCop(trip.driverEarnings)}
        </Text>
      </View>
      <RouteStops
        origin={trip.origin?.address}
        destination={trip.destination?.address}
      />
      <View style={styles.itemBottom}>
        <Text style={styles.caption} numberOfLines={1}>
          {t(`category.${trip.category}`)} ·{" "}
          {t(`payment.${trip.paymentMethod}`)} · {t("history.fare")}{" "}
          {formatCop(trip.fare)}
        </Text>
        <PaymentStatusChip trip={trip} />
      </View>
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const { trips, isLoading, error, hasMore, loadMore } = useTripHistory();
  const [period, setPeriod] = useState("month");
  const [payment, setPayment] = useState("all");
  const [range, setRange] = useState(defaultRange);

  const rangeErrors = useMemo(() => validateDateRange(range), [range]);
  const isRange = period === "range";

  const visibleTrips = useMemo(() => {
    let byDate;
    if (!isRange) byDate = filterTripsByPeriod(trips, period);
    else if (Object.keys(rangeErrors).length === 0) {
      byDate = filterTripsByDateRange(trips, range.from, range.to);
    } else byDate = [];
    return filterTripsByPaymentMethod(byDate, payment);
  }, [trips, period, isRange, range, rangeErrors, payment]);

  // Totals of what the filters show, like the top of Uber's trip list
  const summary = useMemo(() => summarizeTrips(visibleTrips), [visibleTrips]);

  // One FlatList with a header row for each day and its trips below
  const rows = useMemo(
    () =>
      groupTripsByDay(visibleTrips).flatMap((day) => [
        { type: "day", key: `day-${day.dayStart}`, dayStart: day.dayStart },
        ...day.trips.map((trip) => ({ type: "trip", key: trip.id, trip })),
      ]),
    [visibleTrips],
  );

  const dayTitle = (dayStart) => {
    const relative = relativeDay(dayStart);
    if (relative === "today") return t("period.today");
    if (relative === "yesterday") return t("history.yesterday");
    return formatDay(dayStart, language);
  };

  const periodLabel = (option) =>
    option === "range" ? t("history.range") : t(`period.${option}`);
  const paymentLabel = (option) =>
    option === "all" ? t("history.paymentAll") : t(`payment.${option}`);

  let emptyText = t("history.emptyFiltered");
  if (trips.length === 0) emptyText = t("history.empty");
  if (isLoading) emptyText = t("history.loading");
  if (error) emptyText = t(error);

  const header = (
    <View style={styles.header}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {HISTORY_PERIODS.map((option) => (
          <FilterChip
            key={option}
            label={periodLabel(option)}
            isSelected={option === period}
            onPress={() => setPeriod(option)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {PAYMENT_FILTERS.map((option) => (
          <FilterChip
            key={option}
            label={paymentLabel(option)}
            isSelected={option === payment}
            onPress={() => setPayment(option)}
          />
        ))}
      </ScrollView>

      {isRange && (
        <View style={styles.range}>
          <View style={styles.rangeField}>
            <DateField
              label={t("history.from")}
              value={range.from}
              onChange={(from) => setRange((current) => ({ ...current, from }))}
              error={t(rangeErrors.from)}
              maximumDate={new Date()}
            />
          </View>
          <View style={styles.rangeField}>
            <DateField
              label={t("history.to")}
              value={range.to}
              onChange={(to) => setRange((current) => ({ ...current, to }))}
              error={t(rangeErrors.to)}
              maximumDate={new Date()}
            />
          </View>
        </View>
      )}

      {visibleTrips.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryCount}>
            {summary.tripCount === 1
              ? t("history.tripsCountOne")
              : t("history.tripsCount").replace("{count}", summary.tripCount)}
          </Text>
          <Text style={styles.summaryAmount}>
            {formatCop(summary.netEarnings)}
          </Text>
          <Text style={styles.caption}>{t("history.earnings")}</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={rows}
      keyExtractor={(row) => row.key}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      renderItem={({ item }) =>
        item.type === "day" ? (
          <Text style={styles.dayTitle} accessibilityRole="header">
            {dayTitle(item.dayStart)}
          </Text>
        ) : (
          <TripItem
            trip={item.trip}
            onPress={() =>
              navigation.navigate("TripDetail", { tripId: item.trip.id })
            }
          />
        )
      }
      ListEmptyComponent={
        isLoading ? (
          <Skeleton label={emptyText} style={styles.skeleton}>
            <SkeletonBox width={120} height={14} />
            {[0, 1, 2, 3].map((row) => (
              <View key={row} style={styles.skeletonRow}>
                <View style={styles.skeletonTexts}>
                  <SkeletonBox width="40%" height={14} />
                  <SkeletonBox width="85%" height={14} />
                  <SkeletonBox width="70%" height={14} />
                </View>
                <SkeletonBox width={72} height={18} />
              </View>
            ))}
          </Skeleton>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-outline" size={32} color={colors.black} />
            </View>
            <Text style={[styles.emptyText, error && styles.errorText]}>
              {emptyText}
            </Text>
          </View>
        )
      }
      // 20 more trips per load (section 6). The filters only see the trips
      // already loaded, so the button stays while there may be older ones.
      ListFooterComponent={
        hasMore && !isLoading ? (
          <TouchableOpacity
            style={styles.loadMore}
            onPress={loadMore}
            accessibilityRole="button"
          >
            <Text style={styles.loadMoreText}>{t("history.loadMore")}</Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { paddingTop: spacing.md, gap: spacing.sm },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.black },
  chipText: { ...typography.label },
  chipTextSelected: { color: colors.white },
  range: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  rangeField: { flex: 1 },
  summary: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  summaryCount: { fontSize: 14, fontWeight: "600", color: colors.textOnDark },
  summaryAmount: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.white,
    marginVertical: 2,
  },
  dayTitle: {
    ...typography.section,
    fontSize: 18,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  item: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: { ...typography.label, color: colors.textSecondary },
  itemEarnings: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  itemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  caption: { ...typography.caption, flexShrink: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { ...typography.subtitle, textAlign: "center" },
  skeleton: { padding: spacing.lg, gap: spacing.lg },
  skeletonRow: { flexDirection: "row", gap: spacing.lg },
  skeletonTexts: { flex: 1, gap: spacing.sm },
  errorText: { color: colors.error },
  loadMore: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreText: { ...typography.label, fontSize: 15 },
});
