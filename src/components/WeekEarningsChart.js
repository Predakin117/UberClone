// AI-assisted: see docs/AI_LOG.md #31
// Bar chart of this week's net earnings, Monday to Sunday, drawn with Views
// (no chart library). The height of each bar is relative to the best day;
// today's bar is black and the others gray. days is weeklyEarnings.
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { formatCop } from "../i18n/format";

const CHART_HEIGHT = 120;
// A day with earnings always shows a little bar, even next to a big day
const MIN_BAR_HEIGHT = 4;

export default function WeekEarningsChart({ days }) {
  const { t } = useLanguage();
  const best = Math.max(...days.map((item) => item.netEarnings), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("earnings.weekChart")}</Text>
      <View style={styles.chart}>
        {days.map((item) => {
          const height =
            best > 0 && item.netEarnings > 0
              ? Math.max(
                  MIN_BAR_HEIGHT,
                  Math.round((item.netEarnings / best) * CHART_HEIGHT),
                )
              : 0;
          return (
            <View
              key={item.day}
              style={styles.column}
              accessible
              accessibilityLabel={`${t(`weekday.${item.day}`)}: ${formatCop(item.netEarnings)}`}
            >
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    item.isToday && styles.barToday,
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, item.isToday && styles.today]}>
                {t(`weekday.${item.day}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.section },
  chart: { flexDirection: "row", gap: spacing.sm },
  column: { flex: 1, alignItems: "center", gap: spacing.xs },
  barArea: {
    height: CHART_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: radius.sm / 2,
    borderTopRightRadius: radius.sm / 2,
    backgroundColor: colors.disabledText,
  },
  barToday: { backgroundColor: colors.black },
  dayLabel: { ...typography.caption },
  today: { color: colors.textPrimary, fontWeight: "700" },
});
