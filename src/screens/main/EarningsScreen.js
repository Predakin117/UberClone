// AI-assisted: see docs/AI_LOG.md #15, #28, #31, #61
// Earnings of the driver (section 5), like Uber: a week navigator with the
// week's net earnings in big numbers and a bar chart where each day can be
// tapped; then today, this week (since Monday) and this month side by side,
// with the breakdown of the chosen one, and this month's balance with the
// platform. The trips come in real time from useEarningsTrips (no limit); the
// totals from useEarnings and weekEarnings.
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Skeleton, { SkeletonBox } from "../../components/Skeleton";
import WeekEarningsChart from "../../components/WeekEarningsChart";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useEarnings } from "../../hooks/useEarnings";
import { useEarningsTrips } from "../../hooks/useEarningsTrips";
import {
  formatCop,
  formatDay,
  formatShortDate,
  formatSignedCop,
} from "../../i18n/format";
import { PERIODS } from "../../services/earnings";
import { MAX_WEEKS_BACK, weekEarnings } from "../../services/earningsWeeks";

const DAY_MS = 24 * 60 * 60 * 1000;

const Row = ({ label, value, strong = false }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
    <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
  </View>
);

// Round arrow of the week navigator
const WeekArrow = ({ icon, label, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.arrow, disabled && styles.arrowDisabled]}
    onPress={onPress}
    disabled={disabled}
    hitSlop={spacing.sm}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
  >
    <Ionicons
      name={icon}
      size={20}
      color={disabled ? colors.disabledText : colors.black}
    />
  </TouchableOpacity>
);

// Gray blocks in the shape of the screen while the trips load
const EarningsSkeleton = ({ label }) => (
  <Skeleton label={label} style={styles.content}>
    <SkeletonBox width={180} height={18} style={styles.centerBox} />
    <SkeletonBox width={220} height={40} style={styles.centerBox} />
    <SkeletonBox height={150} />
    <View style={styles.tiles}>
      {PERIODS.map((period) => (
        <SkeletonBox key={period} height={72} style={styles.flex} />
      ))}
    </View>
    <SkeletonBox height={180} />
  </Skeleton>
);

export default function EarningsScreen() {
  const { t, language } = useLanguage();
  // 0 is this week, 1 last week…
  const [weekOffset, setWeekOffset] = useState(0);
  // The oldest week opened: the listener keeps those trips while going forward
  const [oldestWeek, setOldestWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const { trips, isLoading, error } = useEarningsTrips(oldestWeek);
  const earnings = useEarnings(trips);
  const week = useMemo(
    () => weekEarnings(trips, weekOffset),
    [trips, weekOffset],
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <EarningsSkeleton label={t("earnings.loading")} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t(error)}</Text>
      </View>
    );
  }

  const changeWeek = (offset) => {
    setWeekOffset(offset);
    setOldestWeek((current) => Math.max(current, offset));
    setSelectedDay(null);
  };

  let weekTitle = `${formatShortDate(week.start, language)} – ${formatShortDate(week.end - DAY_MS, language)}`;
  if (weekOffset === 0) weekTitle = t("period.week");
  if (weekOffset === 1) weekTitle = t("earnings.lastWeek");

  // The big number is the selected day, or the whole week
  const day = selectedDay === null ? null : week.days[selectedDay];
  const shown = day ?? {
    netEarnings: week.total.netEarnings,
    tripCount: week.total.tripCount,
  };
  const tripsText =
    shown.tripCount === 1
      ? t("history.tripsCountOne")
      : t("history.tripsCount").replace("{count}", shown.tripCount);

  const summary = earnings[selectedPeriod];
  const { balance } = earnings;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.weekNav}>
        <WeekArrow
          icon="chevron-back"
          label={t("earnings.previousWeek")}
          onPress={() => changeWeek(weekOffset + 1)}
          disabled={weekOffset >= MAX_WEEKS_BACK}
        />
        <View style={styles.weekTitleBox}>
          <Text style={styles.weekTitle}>{weekTitle}</Text>
          {weekOffset <= 1 && (
            <Text style={styles.caption}>
              {formatShortDate(week.start, language)} –{" "}
              {formatShortDate(week.end - DAY_MS, language)}
            </Text>
          )}
        </View>
        <WeekArrow
          icon="chevron-forward"
          label={t("earnings.nextWeek")}
          onPress={() => changeWeek(weekOffset - 1)}
          disabled={weekOffset === 0}
        />
      </View>

      <View style={styles.hero} accessibilityLiveRegion="polite">
        <Text style={styles.heroAmount}>{formatCop(shown.netEarnings)}</Text>
        <Text style={styles.heroCaption}>
          {day ? formatDay(day.start, language) : t("earnings.weekChart")} ·{" "}
          {tripsText}
        </Text>
      </View>

      <WeekEarningsChart
        days={week.days}
        selectedIndex={selectedDay}
        onSelectDay={setSelectedDay}
      />
      <Text style={[styles.caption, styles.centerText]}>
        {t("earnings.tapDay")}
      </Text>

      <Text style={styles.sectionTitle}>{t("earnings.summary")}</Text>
      <View style={styles.tiles} accessibilityRole="tablist">
        {PERIODS.map((period) => {
          const isSelected = period === selectedPeriod;
          return (
            <TouchableOpacity
              key={period}
              style={[styles.tile, isSelected && styles.tileSelected]}
              onPress={() => setSelectedPeriod(period)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[styles.tileLabel, isSelected && styles.onBlackMuted]}
                numberOfLines={1}
              >
                {t(`period.${period}`)}
              </Text>
              <Text
                style={[styles.tileValue, isSelected && styles.onBlack]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCop(earnings[period].netEarnings)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.card}>
        <Row label={t("earnings.trips")} value={summary.tripCount} />
        <Row
          label={t("earnings.totalFare")}
          value={formatCop(summary.totalFare)}
        />
        <Row
          label={t("earnings.commission")}
          value={`-${formatCop(summary.totalCommission)}`}
        />
        <Row
          label={t("earnings.tips")}
          value={`+${formatCop(summary.totalTips)}`}
        />
        <View style={styles.divider} />
        <Row
          label={t("earnings.net")}
          value={formatCop(summary.netEarnings)}
          strong
        />
        <Row
          label={t("earnings.average")}
          value={formatCop(summary.averagePerTrip)}
        />
      </View>

      <View style={[styles.card, styles.balanceCard]}>
        <View style={styles.balanceTitleRow}>
          <Ionicons name="wallet-outline" size={20} color={colors.white} />
          <Text style={[styles.cardTitle, styles.onBlack]}>
            {t("earnings.balance")}
          </Text>
        </View>
        <Text style={styles.balanceValue}>{formatSignedCop(balance)}</Text>
        <Text style={styles.balanceLabel}>
          {balance < 0 ? t("earnings.balanceDue") : t("earnings.balanceOwed")}
        </Text>
        <Text style={styles.balanceHint}>{t("earnings.balanceHint")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  centerBox: { alignSelf: "center" },
  centerText: { textAlign: "center" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: { backgroundColor: colors.background },
  weekTitleBox: { flex: 1, alignItems: "center" },
  weekTitle: { ...typography.label, fontSize: 16 },
  hero: { alignItems: "center", gap: spacing.xs, marginVertical: spacing.sm },
  heroAmount: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  heroCaption: { ...typography.caption, fontSize: 14 },
  sectionTitle: { ...typography.section, fontSize: 18, marginTop: spacing.lg },
  tiles: { flexDirection: "row", gap: spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tileSelected: { backgroundColor: colors.black },
  tileLabel: { ...typography.caption },
  tileValue: { ...typography.label, fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.section, fontSize: 18 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowLabel: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  rowValue: { ...typography.body },
  strong: { fontWeight: "700", color: colors.textPrimary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  balanceCard: { backgroundColor: colors.black },
  balanceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  onBlack: { color: colors.white },
  onBlackMuted: { color: colors.textOnDark },
  balanceValue: { fontSize: 28, fontWeight: "700", color: colors.white },
  balanceLabel: { ...typography.label, color: colors.white },
  balanceHint: { ...typography.caption, color: colors.disabledText },
  caption: { ...typography.caption },
  errorText: { ...typography.body, color: colors.error, textAlign: "center" },
});
