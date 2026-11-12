// AI-assisted: see docs/AI_LOG.md #15, #28
// Earnings of the driver (section 5): today, this week (since Monday) and this
// month, plus this month's balance with the platform. The trips come in real
// time from useEarningsTrips (no limit); the totals from useEarnings.
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { useEarnings } from "../../hooks/useEarnings";
import { useEarningsTrips } from "../../hooks/useEarningsTrips";
import { formatCop, formatSignedCop } from "../../i18n/format";
import { PERIODS } from "../../services/earnings";

const Row = ({ label, value, strong = false }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
    <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
  </View>
);

export default function EarningsScreen() {
  const { t } = useLanguage();
  const { trips, isLoading, error } = useEarningsTrips();
  const earnings = useEarnings(trips);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.black} />
        <Text style={styles.caption}>{t("earnings.loading")}</Text>
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

  const { balance } = earnings;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {PERIODS.map((period) => {
        const summary = earnings[period];
        return (
          <View key={period} style={styles.card}>
            <Text style={styles.cardTitle}>{t(`period.${period}`)}</Text>
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
        );
      })}

      <View style={[styles.card, styles.balanceCard]}>
        <Text style={[styles.cardTitle, styles.onBlack]}>
          {t("earnings.balance")}
        </Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.section, marginBottom: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rowLabel: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  rowValue: { ...typography.body },
  strong: { fontWeight: "700", color: colors.textPrimary },
  balanceCard: { backgroundColor: colors.black },
  onBlack: { color: colors.white },
  balanceValue: { fontSize: 28, fontWeight: "700", color: colors.white },
  balanceLabel: { ...typography.label, color: colors.white },
  balanceHint: { ...typography.caption, color: colors.disabledText },
  caption: { ...typography.caption, textAlign: "center" },
  errorText: { ...typography.body, color: colors.error, textAlign: "center" },
});
