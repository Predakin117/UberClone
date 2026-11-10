// AI-assisted: see docs/AI_LOG.md #50, #10
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { ScrollView, StyleSheet } from "react-native";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import PhotoField from "../../components/PhotoField";
import SelectField from "../../components/SelectField";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  normalizePlate,
  VEHICLE_FIELDS,
} from "../../validation/vehicle";

export default function VehicleScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const {
    formData,
    errors,
    handleChange,
    touchField,
    touchFields,
    isVehicleValid,
    saveSection,
    isSaving,
    saveError,
  } = useContext(RegistrationContext);

  // Las listas y la foto no tienen onBlur: se marcan como visitadas al elegir
  const handleSelect = (field, value) => {
    handleChange(field, value);
    touchField(field);
  };

  // Si la pestaña es válida se guarda en Firestore y solo entonces se avanza
  const handleNext = async () => {
    touchFields(VEHICLE_FIELDS);
    if (!isVehicleValid) return;
    if (await saveSection("vehicle")) navigation.navigate("Documents");
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

      <NextButton
        label="Siguiente"
        onPress={handleNext}
        isSaving={isSaving}
        error={saveError?.section === "vehicle" && t(saveError.code)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
});
