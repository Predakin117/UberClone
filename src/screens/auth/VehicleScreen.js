import { useContext } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { RegistrationContext } from "../../contexts/RegistrationContext";

export default function VehicleScreen() {
  const { formData, errors, handleChange, setErrors } =
    useContext(RegistrationContext);

  const handleBlur = (field) => {
    // Validación al perder el foco
    if (field === "vehicleMake" && formData.vehicleMake.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        vehicleMake: "La marca/modelo es obligatoria",
      }));
    }
    if (field === "plate" && formData.plate.trim() === "") {
      setErrors((prev) => ({ ...prev, plate: "La placa es obligatoria" }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Marca y Modelo</Text>
      <TextInput
        style={[styles.input, errors.vehicleMake && styles.inputError]}
        value={formData.vehicleMake}
        onChangeText={(text) => handleChange("vehicleMake", text)}
        onBlur={() => handleBlur("vehicleMake")}
        placeholder="Ej. Chevrolet Spark"
      />
      {errors.vehicleMake && (
        <Text style={styles.errorText}>{errors.vehicleMake}</Text>
      )}

      <Text style={styles.label}>Placa del Vehículo</Text>
      <TextInput
        style={[styles.input, errors.plate && styles.inputError]}
        value={formData.plate}
        onChangeText={(text) => handleChange("plate", text)}
        onBlur={() => handleBlur("plate")}
        placeholder="Ej. XYZ-123"
        autoCapitalize="characters"
      />
      {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}
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
