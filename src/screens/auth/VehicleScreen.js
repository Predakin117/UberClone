// AI-assisted: see docs/AI_LOG.md #50, #10, #54
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { StyleSheet } from "react-native";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import PhotoField from "../../components/PhotoField";
import SelectField from "../../components/SelectField";
import StepLayout from "../../components/StepLayout";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import {
  CATEGORY_VALUES,
  COLOR_VALUES,
  MAX_VEHICLE_NAME_LENGTH,
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

  // Option labels in the chosen language
  const categoryOptions = CATEGORY_VALUES.map((value) => ({
    value,
    label: t(`category.${value}`),
  }));
  const colorOptions = COLOR_VALUES.map((value) => ({
    value,
    label: t(`color.${value}`),
  }));

  // Lists and the photo have no onBlur: they're marked as visited when chosen
  const handleSelect = (field, value) => {
    handleChange(field, value);
    touchField(field);
  };

  // Only digits for year and capacity, even if a symbol gets pasted
  const handleDigits = (field) => (text) =>
    handleChange(field, text.replace(/\D/g, ""));

  // If the tab is valid it's saved in Firestore and only then it moves on
  const handleNext = async () => {
    touchFields(VEHICLE_FIELDS);
    if (!isVehicleValid) return;
    if (await saveSection("vehicle")) navigation.navigate("Documents");
  };

  return (
    <StepLayout
      title={t("register.title.Vehicle")}
      subtitle={t("register.subtitle.Vehicle")}
      footer={
        <NextButton
          label={t("common.next")}
          onPress={handleNext}
          isSaving={isSaving}
          error={saveError?.section === "vehicle" && t(saveError.code)}
          style={styles.footerButton}
        />
      }
    >
      <SelectField
        label={t("vehicle.category")}
        value={formData.category}
        options={categoryOptions}
        onChange={(value) => handleSelect("category", value)}
        error={t(errors.category)}
      />

      <FormField
        label={t("vehicle.plate")}
        value={formData.plate}
        onChangeText={(text) => handleChange("plate", normalizePlate(text))}
        onBlur={() => touchField("plate")}
        error={t(errors.plate)}
        placeholder={t("vehicle.platePlaceholder")}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />

      <FormField
        label={t("vehicle.make")}
        value={formData.vehicleMake}
        onChangeText={(text) => handleChange("vehicleMake", text)}
        onBlur={() => touchField("vehicleMake")}
        error={t(errors.vehicleMake)}
        placeholder={t("vehicle.makePlaceholder")}
        autoCapitalize="words"
        maxLength={MAX_VEHICLE_NAME_LENGTH}
        showLimit
      />

      <FormField
        label={t("vehicle.model")}
        value={formData.vehicleModel}
        onChangeText={(text) => handleChange("vehicleModel", text)}
        onBlur={() => touchField("vehicleModel")}
        error={t(errors.vehicleModel)}
        placeholder={t("vehicle.modelPlaceholder")}
        maxLength={MAX_VEHICLE_NAME_LENGTH}
        showLimit
      />

      <FormField
        label={t("vehicle.year")}
        value={formData.year}
        onChangeText={handleDigits("year")}
        onBlur={() => touchField("year")}
        error={t(errors.year)}
        placeholder={t("vehicle.yearPlaceholder")}
        keyboardType="number-pad"
        maxLength={4}
      />

      <SelectField
        label={t("vehicle.color")}
        value={formData.color}
        options={colorOptions}
        onChange={(value) => handleSelect("color", value)}
        error={t(errors.color)}
      />

      <FormField
        label={t("vehicle.capacity")}
        value={formData.capacity}
        onChangeText={handleDigits("capacity")}
        onBlur={() => touchField("capacity")}
        error={t(errors.capacity)}
        placeholder={
          formData.category === "xl"
            ? t("vehicle.capacityPlaceholderXl")
            : t("vehicle.capacityPlaceholder")
        }
        keyboardType="number-pad"
        maxLength={1}
      />

      <PhotoField
        label={t("vehicle.photo")}
        uri={formData.vehiclePhoto}
        onChange={(uri) => handleSelect("vehiclePhoto", uri)}
        error={t(errors.vehiclePhoto)}
      />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  footerButton: { marginTop: 0 },
});
