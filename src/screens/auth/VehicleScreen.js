// AI-assisted: see docs/AI_LOG.md #50
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import FormField from "../../components/FormField";
import PhotoField from "../../components/PhotoField";
import SelectField from "../../components/SelectField";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  normalizePlate,
  VEHICLE_FIELDS,
} from "../../validation/vehicle";

export default function VehicleScreen() {
  const navigation = useNavigation();
  const {
    formData,
    errors,
    handleChange,
    touchField,
    touchFields,
    isVehicleValid,
  } = useContext(RegistrationContext);

  // Las listas y la foto no tienen onBlur: se marcan como visitadas al elegir
  const handleSelect = (field, value) => {
    handleChange(field, value);
    touchField(field);
  };

  const handleNext = () => {
    touchFields(VEHICLE_FIELDS);
    if (isVehicleValid) navigation.navigate("Documents");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <SelectField
        label="Categoría"
        value={formData.category}
        options={CATEGORY_OPTIONS}
        onChange={(value) => handleSelect("category", value)}
        error={errors.category}
      />

      <FormField
        label="Placa"
        value={formData.plate}
        onChangeText={(text) => handleChange("plate", normalizePlate(text))}
        onBlur={() => touchField("plate")}
        error={errors.plate}
        placeholder="Ej. ABC123"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />

      <FormField
        label="Marca"
        value={formData.vehicleMake}
        onChangeText={(text) => handleChange("vehicleMake", text)}
        onBlur={() => touchField("vehicleMake")}
        error={errors.vehicleMake}
        placeholder="Ej. Chevrolet"
        maxLength={30}
      />

      <FormField
        label="Modelo"
        value={formData.vehicleModel}
        onChangeText={(text) => handleChange("vehicleModel", text)}
        onBlur={() => touchField("vehicleModel")}
        error={errors.vehicleModel}
        placeholder="Ej. Spark GT"
        maxLength={30}
      />

      <FormField
        label="Año"
        value={formData.year}
        onChangeText={(text) => handleChange("year", text)}
        onBlur={() => touchField("year")}
        error={errors.year}
        placeholder="Ej. 2020"
        keyboardType="number-pad"
        maxLength={4}
      />

      <SelectField
        label="Color"
        value={formData.color}
        options={COLOR_OPTIONS}
        onChange={(value) => handleSelect("color", value)}
        error={errors.color}
      />

      <FormField
        label="Capacidad de pasajeros"
        value={formData.capacity}
        onChangeText={(text) => handleChange("capacity", text)}
        onBlur={() => touchField("capacity")}
        error={errors.capacity}
        placeholder={formData.category === "xl" ? "Mínimo 6" : "Ej. 4"}
        keyboardType="number-pad"
        maxLength={2}
      />

      <PhotoField
        label="Foto del vehículo (debe verse la placa)"
        uri={formData.vehiclePhoto}
        onChange={(uri) => handleSelect("vehiclePhoto", uri)}
        error={errors.vehiclePhoto}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
