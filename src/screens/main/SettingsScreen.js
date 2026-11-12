// AI-assisted: see docs/AI_LOG.md #30
// Settings (section 3): app language, the platform fee (from pricing.js, as
// information), the app version and logout.
import Constants from "expo-constants";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COMMISSION_RATE } from "../../config/pricing";
import {
  CONTROL_HEIGHT,
  colors,
  radius,
  spacing,
  typography,
} from "../../config/theme";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "../../validation/personalInfo";

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const commissionPercent = Math.round(COMMISSION_RATE * 100);
  const version = Constants.expoConfig?.version ?? "";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // logout never throws; the screen goes away when the session closes
    await logout();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("personal.language")}</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = option.value === language;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setLanguage(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.commission")}</Text>
        <Text style={styles.body}>
          {t("settings.commissionValue").replace("{percent}", commissionPercent)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.version")}</Text>
        <Text style={styles.body}>{version}</Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isLoggingOut && styles.disabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoggingOut }}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.logoutText}>{t("drawer.logout")}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.label, fontSize: 16 },
  body: { ...typography.body, color: colors.textSecondary },
  options: { flexDirection: "row", gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: { backgroundColor: colors.black, borderColor: colors.black },
  optionText: { ...typography.label, fontSize: 16 },
  optionTextSelected: { color: colors.white },
  logoutButton: {
    minHeight: CONTROL_HEIGHT,
    marginTop: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
