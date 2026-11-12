// AI-assisted: see docs/AI_LOG.md #28
// Trip history of the driver: the last finished trips (completed or paid) in
// real time, filtered by today, this week (since Monday) or this month.
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTripHistory } from "../../hooks/useTripHistory";
import { formatCop, formatDateTime } from "../../i18n/format";
import {
  PERIODS,
  completedAtMillis,
  filterTripsByPeriod,
} from "../../services/earnings";
import { paymentStatusKey } from "../../services/trips";

const TripItem = ({ trip }) => {
  const { t, language } = useLanguage();
  return (
    <View style={styles.item}>
      <Text style={styles.date}>
        {formatDateTime(completedAtMillis(trip), language)}
      </Text>
      <Text style={styles.route} numberOfLines={2}>
        {trip.origin?.address} → {trip.destination?.address}
      </Text>
      <Text style={styles.caption}>
        {t(`category.${trip.category}`)} · {t(`payment.${trip.paymentMethod}`)}{" "}
        · {t(paymentStatusKey(trip))}
      </Text>
      <View style={styles.amounts}>
        <Text style={styles.caption}>
          {t("history.fare")}: {formatCop(trip.fare)}
        </Text>
        <Text style={styles.earnings}>
          {t("history.earnings")}: {formatCop(trip.driverEarnings)}
        </Text>
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const { t } = useLanguage();
  const { trips, isLoading, error } = useTripHistory();
  const [period, setPeriod] = useState("month");

  const visibleTrips = useMemo(
    () => filterTripsByPeriod(trips, period),
    [trips, period],
  );

  let emptyText = t("history.empty");
  if (isLoading) emptyText = t("history.loading");
  if (error) emptyText = t(error);

  return (
    <View style={styles.screen}>
      <View style={styles.filters} accessibilityRole="tablist">
        {PERIODS.map((option) => {
          const selected = option === period;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.filter, selected && styles.filterSelected]}
              onPress={() => setPeriod(option)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.filterText, selected && styles.filterTextSelected]}
              >
                {t(`period.${option}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={visibleTrips}
        keyExtractor={(trip) => trip.id}
        renderItem={({ item }) => <TripItem trip={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading && <ActivityIndicator color={colors.black} />}
            <Text style={[styles.emptyText, error && styles.errorText]}>
              {emptyText}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filter: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  filterSelected: { backgroundColor: colors.black },
  filterText: { ...typography.label },
  filterTextSelected: { color: colors.white },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  date: { ...typography.label },
  route: { ...typography.body },
  caption: { ...typography.caption },
  amounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  earnings: { ...typography.label, color: colors.success },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyText: { ...typography.subtitle, textAlign: "center" },
  errorText: { color: colors.error },
});
