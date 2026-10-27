// AI-assisted: see docs/AI_LOG.md #3, #4
import { useContext } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { RegistrationContext } from "../../contexts/RegistrationContext";

export default function DocumentsScreen() {
  const {
    formData,
    errors,
    setErrors,
    handleChange,
    canSubmit,
    submitRegistration,
  } = useContext(RegistrationContext);

  const handleBlur = () => {
    // Validación al perder el foco
    if (formData.licenseNumber.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        licenseNumber: "El número de licencia es obligatorio",
      }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Número de Licencia</Text>
      <TextInput
        style={[styles.input, errors.licenseNumber && styles.inputError]}
        value={formData.licenseNumber}
        onChangeText={(text) => handleChange("licenseNumber", text)}
        onBlur={handleBlur}
        placeholder="Ej. 123456789"
      />
      {errors.licenseNumber && (
        <Text style={styles.errorText}>{errors.licenseNumber}</Text>
      )}
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
  label: { fontSize: 16, marginBottom: 5, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  inputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12, marginBottom: 15 },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
