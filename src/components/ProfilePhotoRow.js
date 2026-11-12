// AI-assisted: see docs/AI_LOG.md #58
// Profile photo of tab 1 as a row, like Uber: the avatar, whether it's still
// pending and an arrow. Tapping it opens the selfie step (ProfilePhotoScreen).
// error is already translated.
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import Avatar from "./Avatar";
import Chevron from "./Chevron";
import { formStyles } from "./formStyles";

export default function ProfilePhotoRow({ label, uri, onPress, error }) {
  const { t } = useLanguage();
  const hasPhoto = uri !== "";

  return (
    <View style={formStyles.field}>
      <TouchableOpacity
        style={[styles.row, error && formStyles.inputError]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View>
          <Avatar uri={uri} size={56} />
          {hasPhoto && (
            <View style={styles.check}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.texts}>
          <Text style={typography.label}>{label}</Text>
          <Text style={typography.caption}>
            {hasPhoto
              ? t("personal.profilePhotoReady")
              : t("personal.profilePhotoPending")}
          </Text>
        </View>
        <Chevron direction="right" />
      </TouchableOpacity>
      {error && <Text style={formStyles.errorText}>{error}</Text>}
    </View>
  );
}

const CHECK_SIZE = 20;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.md,
    paddingRight: spacing.lg + 4,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
  texts: { flex: 1, gap: 2 },
  check: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: colors.white, fontSize: 10, fontWeight: "700" },
});
