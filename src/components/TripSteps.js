// Steps of the current trip, like Uber: Pick up → On trip → Collect. Three
// bars with their names; the steps done and the current one are black, the
// next ones gray. current is the index of the step (0, 1 or 2). It only shows
// where the trip is; the trip status still decides everything.
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";

const STEPS = ["pickup", "ride", "collect"];

export default function TripSteps({ current }) {
  const { t } = useLanguage();

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t("tripSteps.label")
        .replace("{step}", current + 1)
        .replace("{total}", STEPS.length)
        .replace("{name}", t(`tripSteps.${STEPS[current]}`))}
    >
      {STEPS.map((step, index) => {
        const isReached = index <= current;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.bar, isReached && styles.barReached]} />
            <Text
              style={[styles.name, index === current && styles.nameCurrent]}
              numberOfLines={1}
            >
              {t(`tripSteps.${step}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  step: { flex: 1, gap: spacing.xs },
  bar: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  barReached: { backgroundColor: colors.black },
  name: { ...typography.caption, fontSize: 12 },
  nameCurrent: { color: colors.textPrimary, fontWeight: "700" },
});
