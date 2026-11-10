// AI-assisted: see docs/AI_LOG.md #10, #13
// Botón principal de cada pestaña del registro: muestra "Guardando…" (o busyLabel)
// mientras trabaja y el error debajo si algo falla (nunca en un Alert).
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { formStyles } from "./formStyles";

export default function NextButton({
  label,
  onPress,
  isSaving = false,
  disabled = false,
  busyLabel,
  error,
}) {
  const { t } = useLanguage();
  const isDisabled = disabled || isSaving;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isSaving }}
      >
        {isSaving ? (
          <View style={styles.row}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>
              {busyLabel ?? t("save.saving")}
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={formStyles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 10 },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#999" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
