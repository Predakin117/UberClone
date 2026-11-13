// AI-assisted: see docs/AI_LOG.md #60, #61
// Receipt of a finished trip: fare, platform fee, tip and the net earnings in
// green. The amounts are the ones saved when the trip was completed
// (calculateFare in src/config/pricing.js); nothing is recomputed here.
// Shared by the trip summary and the trip details of the history.
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { formatCop } from "../i18n/format";

const AmountRow = ({ label, value, isTotal = false }) => (
  <View style={[styles.row, isTotal && styles.totalRow]}>
    <Text style={isTotal ? styles.totalLabel : styles.label}>{label}</Text>
    <Text style={isTotal ? styles.totalValue : styles.value}>{value}</Text>
  </View>
);

export default function FareBreakdown({ trip, style }) {
  const { t } = useLanguage();

  return (
    <View style={[styles.card, style]}>
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  label: { ...typography.body, fontSize: 15, flexShrink: 1 },
  value: { ...typography.body, fontSize: 15 },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  totalLabel: { ...typography.label, fontSize: 16, flexShrink: 1 },
  totalValue: { fontSize: 17, fontWeight: "700", color: colors.success },
});
