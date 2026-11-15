// AI-assisted: see docs/AI_LOG.md #59
// First screen without a session, like the Uber driver app: black background,
// the app name, a road with the car, three benefits and "Get started", which
// opens the login. The language can be changed here before logging in.
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CarShape } from "../../components/CarMarker";
import Chevron from "../../components/Chevron";
import { colors, CONTROL_HEIGHT, radius, spacing } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "../../validation/personalInfo";

const BENEFITS = [
  "welcome.benefitSchedule",
  "welcome.benefitEarnings",
  "welcome.benefitPayments",
];

// Dashes of the center line of the road
const DASHES = 7;

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  // The drawing shrinks on short phones so everything fits without scrolling
  const { height } = useWindowDimensions();
  const heroSize = Math.round(Math.min(MAX_HERO_SIZE, height * 0.27));

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm,
        },
      ]}
    >
      {/* White status bar icons only while this screen is visible: the
          screens on top of it are white */}
      {isFocused && <StatusBar style="light" />}

      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Text style={styles.wordmark}>{t("app.name")}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t("app.driverBadge")}</Text>
          </View>
        </View>

        <View style={styles.languages}>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.value === language;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.language, isSelected && styles.languageOn]}
                onPress={() => setLanguage(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={t("welcome.language").replace(
                  "{language}",
                  option.label,
                )}
              >
                <Text
                  style={[
                    styles.languageText,
                    isSelected && styles.languageTextOn,
                  ]}
                >
                  {option.value.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Illustration: a road seen from above with a pickup pin and the car
          of the map. It's decorative, so screen readers skip it. */}
      <View
        style={[
          styles.hero,
          { width: heroSize, height: heroSize, borderRadius: heroSize / 2 },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.road}>
          {Array.from({ length: DASHES }, (_, index) => (
            <View key={index} style={styles.dash} />
          ))}
        </View>
        <View
          style={[
            styles.pin,
            { top: heroSize * 0.16, left: heroSize / 2 + 10 },
          ]}
        >
          <View style={styles.pinDot} />
        </View>
        <View style={[styles.car, { bottom: heroSize * 0.26 }]}>
          <CarShape />
        </View>
      </View>

      <View>
        <Text style={styles.headline} accessibilityRole="header">
          {t("welcome.headline")}
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefit}>
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={styles.benefitText}>{t(benefit)}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.start}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.startText}>{t("welcome.start")}</Text>
          <Chevron direction="right" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MAX_HERO_SIZE = 220;
const ROAD_WIDTH = 72;
const CHECK_SIZE = 24;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.xl - 4,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  wordmark: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 3,
  },
  badgeText: { color: colors.black, fontSize: 12, fontWeight: "700" },
  languages: {
    flexDirection: "row",
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.pill,
    padding: 3,
  },
  language: {
    minWidth: 40,
    minHeight: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  languageOn: { backgroundColor: colors.white },
  languageText: { fontSize: 13, fontWeight: "700", color: colors.textOnDark },
  languageTextOn: { color: colors.black },
  hero: {
    alignSelf: "center",
    backgroundColor: colors.surfaceDark,
    alignItems: "center",
    overflow: "hidden",
  },
  road: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: ROAD_WIDTH,
    backgroundColor: colors.borderDark,
    alignItems: "center",
    justifyContent: "space-evenly",
    transform: [{ rotate: "-14deg" }, { scaleY: 1.3 }],
  },
  dash: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  pin: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.black,
  },
  car: {
    position: "absolute",
    transform: [{ rotate: "-14deg" }, { scale: 1.5 }],
  },
  headline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: colors.white,
    marginBottom: spacing.xl,
  },
  benefits: { gap: spacing.md, marginBottom: spacing.xxl },
  benefit: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    backgroundColor: colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  benefitText: { flex: 1, fontSize: 16, color: colors.textOnDark },
  start: {
    minHeight: CONTROL_HEIGHT + 4,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl - 4,
  },
  startText: { fontSize: 17, fontWeight: "600", color: colors.black },
});
