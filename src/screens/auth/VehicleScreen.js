// AI-assisted: see docs/AI_LOG.md #6
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import FormField from "../../components/FormField";
import { RegistrationContext } from "../../contexts/RegistrationContext";

// Solo se adaptó al nuevo contexto: la pantalla completa se hace en ximena/pestana-2
export default function VehicleScreen() {
  const { formData, errors, handleChange, touchField } =
    useContext(RegistrationContext);

  return (
    <View style={styles.container}>
      <FormField
        label="Marca"
        value={formData.vehicleMake}
        onChangeText={(text) => handleChange("vehicleMake", text)}
        onBlur={() => touchField("vehicleMake")}
        error={errors.vehicleMake}
        placeholder="Ej. Chevrolet"
      />

      <FormField
        label="Placa del Vehículo"
        value={formData.plate}
        onChangeText={(text) => handleChange("plate", text)}
        onBlur={() => touchField("plate")}
        error={errors.plate}
        placeholder="Ej. ABC123"
        autoCapitalize="characters"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
});
