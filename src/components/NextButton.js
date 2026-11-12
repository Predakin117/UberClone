// AI-assisted: see docs/AI_LOG.md #10, #13, #54, #56
// Botón principal de cada pestaña del registro: muestra "Guardando…" mientras se
// guarda en Firestore y el error debajo si algo falla (nunca en un Alert).
// The login screens and the email confirmation use it too, with their own
// loadingLabel and style.
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, CONTROL_HEIGHT, radius } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { formStyles } from "./formStyles";

export default function NextButton({
  label,
  onPress,
  isSaving = false,
  disabled = false,
  error,
  loadingLabel,
  style,
}) {
  const { t } = useLanguage();
  const isDisabled = disabled || isSaving;
  // While saving it stays black with the spinner; gray only when it can't
  // be used
  const looksDisabled = disabled && !isSaving;

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={[styles.button, looksDisabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isSaving }}
      >
        {isSaving ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.buttonText}>
              {loadingLabel ?? t("save.saving")}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.buttonText, looksDisabled && styles.textDisabled]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
      {error && <Text style={formStyles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 10 },
  button: {
    minHeight: CONTROL_HEIGHT + 4,
    paddingHorizontal: 16,
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { backgroundColor: colors.disabledBackground },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "600" },
  textDisabled: { color: colors.disabledText },
});
