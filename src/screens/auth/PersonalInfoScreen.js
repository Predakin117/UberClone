// AI-assisted: see docs/AI_LOG.md #3, #4
import { useContext } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  isValidEmail,
  RegistrationContext,
} from "../../contexts/RegistrationContext";

export default function PersonalInfoScreen() {
  const { formData, errors, handleChange, setErrors } =
    useContext(RegistrationContext);

  const handleBlur = (field) => {
    // Validación al perder el foco
    if (field === "name" && formData.name.trim() === "") {
      setErrors((prev) => ({ ...prev, name: "El nombre es obligatorio" }));
    }
    if (field === "email" && !isValidEmail(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Ingresa un correo electrónico válido",
      }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre Completo</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
        onBlur={() => handleBlur("name")}
        placeholder="Ej. Tamiro Solano"
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <Text style={styles.label}>Correo Electrónico</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        onBlur={() => handleBlur("email")}
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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
});
