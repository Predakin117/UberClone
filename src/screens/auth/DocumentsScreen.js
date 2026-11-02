// AI-assisted: see docs/AI_LOG.md #3, #4, #6
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FormField from "../../components/FormField";
import { RegistrationContext } from "../../contexts/RegistrationContext";

export default function DocumentsScreen() {
  const {
    formData,
    errors,
    handleChange,
    touchField,
    canSubmit,
    submitRegistration,
  } = useContext(RegistrationContext);

  return (
    <View style={styles.container}>
      <FormField
        label="Número de Licencia"
        value={formData.licenseNumber}
        onChangeText={(text) => handleChange("licenseNumber", text)}
        onBlur={() => touchField("licenseNumber")}
        error={errors.licenseNumber}
        placeholder="Ej. 123456789"
      />
      {/* Espaciador */}
      <View style={{ flex: 1 }} />
      {/* Botón condicionado a canSubmit */}
      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit}
        onPress={submitRegistration}
      >
        <Text style={styles.buttonText}>
          {canSubmit ? "Enviar Registro" : "Completa todas las pestañas"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
