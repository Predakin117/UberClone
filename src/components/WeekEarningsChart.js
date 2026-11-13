// AI-assisted: see docs/AI_LOG.md #31, #61
// Bar chart of a week's net earnings, Monday to Sunday, drawn with Views
// (no chart library). The height of each bar is relative to the best day.
// days comes from weekEarnings. Like Uber, each bar can be tapped: the
// selected day is black (today, when none is selected) and the rest gray;
// tapping the selected bar again deselects it.
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { formatCop } from "../i18n/format";

const CHART_HEIGHT = 140;
// A day with earnings always shows a little bar, even next to a big day
const MIN_BAR_HEIGHT = 4;

export default function WeekEarningsChart({
  days,
  selectedIndex = null,
  onSelectDay,
}) {
  const { t } = useLanguage();
  const best = Math.max(...days.map((item) => item.netEarnings), 0);

  return (
    <View style={styles.chart}>
      {days.map((item, index) => {
        const height =
          best > 0 && item.netEarnings > 0
            ? Math.max(
                MIN_BAR_HEIGHT,
                Math.round((item.netEarnings / best) * CHART_HEIGHT),
              )
            : 0;
        const isSelected = selectedIndex === index;
        const isHighlighted =
          isSelected || (selectedIndex === null && item.isToday);
        return (
          <TouchableOpacity
            key={item.day}
            style={styles.column}
            onPress={() => onSelectDay?.(isSelected ? null : index)}
            disabled={!onSelectDay}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${t(`weekday.${item.day}`)}: ${formatCop(item.netEarnings)}`}
          >
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  { height },
                  isHighlighted && styles.barSelected,
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, isHighlighted && styles.selected]}>
              {t(`weekday.${item.day}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: "row", gap: spacing.sm },
  column: { flex: 1, alignItems: "center", gap: spacing.xs },
  // The bars stand on a thin base line
  barArea: {
    height: CHART_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: radius.sm / 2,
    borderTopRightRadius: radius.sm / 2,
    backgroundColor: colors.disabledText,
  },
  barSelected: { backgroundColor: colors.black },
  dayLabel: { ...typography.caption },
  selected: { color: colors.textPrimary, fontWeight: "700" },
});
