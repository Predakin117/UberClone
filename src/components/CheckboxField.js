// AI-assisted: see docs/AI_LOG.md #12
// Casilla de verificación: la usa la aceptación de términos de la pestaña 3.
// El error se muestra debajo, como en los demás campos, nunca en un Alert.
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formStyles } from "./formStyles";

export default function CheckboxField({ label, value, onChange, error }) {
  return (
    <View style={formStyles.field}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => onChange(!value)}
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#000", borderColor: "#000" },
  checkMark: { color: "#fff", fontWeight: "bold" },
  label: { flex: 1, fontSize: 14, lineHeight: 20 },
});
