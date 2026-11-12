// AI-assisted: see docs/AI_LOG.md #12
// Casilla de verificación: la usa la aceptación de términos de la pestaña 3.
// El error se muestra debajo, como en los demás campos, nunca en un Alert.
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../config/theme";
import { formStyles } from "./formStyles";

export default function CheckboxField({ label, value, onChange, error }) {
  return (
    <View style={formStyles.field}>
      <TouchableOpacity
        style={[styles.row, error && styles.rowError]}
        onPress={() => onChange(!value)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
      >
        <View
          style={[
            styles.box,
            value && styles.boxChecked,
            error && formStyles.inputError,
          ]}
        >
          {value && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
      {error && <Text style={formStyles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowError: { borderColor: colors.error },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: colors.black, borderColor: colors.black },
  checkMark: { color: colors.white, fontWeight: "700" },
  label: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
});
