// AI-assisted: see docs/AI_LOG.md #56
// Top bar of the registration: "Step X of 3", the % completed and the 3 steps.
// It replaces the default tab bar (AuthTabs passes it as tabBar) and keeps its
// behavior: tapping a step opens that tab. The % comes from
// validation/progress.js, which only reads the validators.
import { useContext, useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { RegistrationContext } from "../contexts/RegistrationContext";
import { getRegistrationProgress } from "../validation/progress";

export default function RegistrationStepBar({ state, navigation, insets }) {
  const { t } = useLanguage();
  const { formData } = useContext(RegistrationContext);
  const { steps, percent } = useMemo(
    () => getRegistrationProgress(formData),
    [formData],
  );

  // The bar fills smoothly when the % changes
  const [fill] = useState(() => new Animated.Value(percent));
  useEffect(() => {
    Animated.timing(fill, {
      toValue: percent,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [fill, percent]);
  const fillWidth = fill.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const stepDone = (name) =>
    steps.find((step) => step.name === name)?.isComplete ?? false;

  // Same as the default tab bar: tapping another step navigates to it
  const openStep = (route, isFocused) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topRow}>
        <Text style={styles.stepOf}>
          {t("register.stepOf")
            .replace("{step}", state.index + 1)
            .replace("{total}", state.routes.length)}
        </Text>
        <Text style={styles.percent}>
          {t("register.percent").replace("{percent}", percent)}
        </Text>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <Animated.View
          style={[
            styles.fill,
            { width: fillWidth },
            percent === 100 && styles.fillDone,
          ]}
        />
      </View>

      <View style={styles.steps} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isDone = stepDone(route.name);
          const label = t(`register.step.${route.name}`);

          return (
            <Pressable
              key={route.key}
              style={styles.step}
              onPress={() => openStep(route, isFocused)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={t(
                isDone ? "register.stepDone" : "register.stepPending",
              ).replace("{label}", label)}
            >
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.badge,
                    isDone && styles.badgeDone,
                    isFocused && !isDone && styles.badgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      (isDone || isFocused) && styles.badgeTextOn,
                    ]}
                  >
                    {isDone ? "✓" : index + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.stepLabel, isFocused && styles.stepLabelOn]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
              <View
                style={[styles.underline, isFocused && styles.underlineOn]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const BADGE_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.sm,
  },
  stepOf: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  percent: { fontSize: 13, color: colors.textSecondary },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  fillDone: { backgroundColor: colors.success },
  steps: { flexDirection: "row", marginTop: spacing.md },
  step: { flex: 1, alignItems: "center" },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: { backgroundColor: colors.black },
  badgeDone: { backgroundColor: colors.success },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  badgeTextOn: { color: colors.white },
  stepLabel: { fontSize: 14, color: colors.textSecondary },
  stepLabelOn: { color: colors.textPrimary, fontWeight: "700" },
  underline: {
    alignSelf: "stretch",
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: "transparent",
  },
  underlineOn: { backgroundColor: colors.black },
});
