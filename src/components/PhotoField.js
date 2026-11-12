// AI-assisted: see docs/AI_LOG.md #7, #9, #56, #58
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { usePhotoPicker } from "../hooks/usePhotoPicker";
import { formStyles } from "./formStyles";

export default function PhotoField({ label, uri, onChange, error }) {
  const { t } = useLanguage();
  // The permission and the camera or gallery live in usePhotoPicker
  const { pick, errorKey } = usePhotoPicker(onChange);

  const message = t(errorKey) || error;
  const hasPhoto = uri !== "";

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>

      {/* Card: the photo (or a placeholder) with the two buttons inside */}
      <View
        style={[
          styles.card,
          hasPhoto && styles.cardFilled,
          message && formStyles.inputError,
        ]}
      >
        {hasPhoto ? (
          <View>
            <Image source={{ uri }} style={styles.preview} contentFit="cover" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ {t("photo.added")}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
            <Text style={styles.emptyHint}>{t("photo.emptyHint")}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => pick("camera")}
          >
            <Text style={styles.buttonText}>{t("photo.takePhoto")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => pick("library")}
          >
            <Text style={styles.buttonText}>
              {t("photo.chooseFromGallery")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {message && <Text style={formStyles.errorText}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardFilled: { borderStyle: "solid", backgroundColor: colors.background },
  empty: { alignItems: "center", paddingVertical: spacing.md, gap: spacing.sm },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  plus: {
    color: colors.white,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "300",
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  preview: { width: "100%", height: 180, borderRadius: radius.sm },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  buttonRow: { flexDirection: "row", gap: spacing.sm },
  // Pill-shaped secondary buttons
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfacePressed,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  buttonText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
});
