// AI-assisted: see docs/AI_LOG.md #30, #61
// Settings (section 3): app language, the platform fee (from pricing.js, as
// information), the app version and logout. Like Uber's settings: groups of
// rows, each with its round icon, and logout in red at the end.
import { Ionicons } from "@expo/vector-icons";
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

const ICON_SIZE = 40;

// One row: round icon, title, an optional text under it and the value on the
// right. children go under the row (the language options).
const SettingRow = ({ icon, title, detail, value, children }) => (
  <View style={styles.row}>
    <View style={styles.rowTop}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.black} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
    {children}
  </View>
);

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
      <Text style={styles.groupTitle}>{t("settings.preferences")}</Text>
      <View style={styles.group}>
        <SettingRow icon="language-outline" title={t("personal.language")}>
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
                  {selected && (
                    <Ionicons name="checkmark" size={18} color={colors.white} />
                  )}
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
        </SettingRow>
      </View>

      <Text style={styles.groupTitle}>{t("settings.about")}</Text>
      <View style={styles.group}>
        <SettingRow
          icon="pricetag-outline"
          title={t("settings.commission")}
          detail={t("settings.commissionValue").replace(
            "{percent}",
            commissionPercent,
          )}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="information-circle-outline"
          title={t("settings.version")}
          value={version}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isLoggingOut && styles.disabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoggingOut }}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={colors.error} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>{t("drawer.logout")}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  groupTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  group: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  row: { paddingVertical: spacing.lg, gap: spacing.md },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTexts: { flex: 1, gap: 2 },
  rowTitle: { ...typography.label, fontSize: 16 },
  rowDetail: { ...typography.caption, fontSize: 14 },
  rowValue: { ...typography.body, color: colors.textSecondary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: ICON_SIZE + spacing.md,
  },
  options: { flexDirection: "row", gap: spacing.sm },
  option: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
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
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: CONTROL_HEIGHT,
    marginTop: spacing.xl,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.errorBackground,
    backgroundColor: colors.errorBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
