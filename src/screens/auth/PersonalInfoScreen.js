// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #9
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import DateField from "../../components/DateField";
import FormField from "../../components/FormField";
import PhotoField from "../../components/PhotoField";
import SelectField from "../../components/SelectField";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { yearsAgo } from "../../validation/dates";
import {
  GENDER_VALUES,
  LANGUAGE_OPTIONS,
  MAX_NAME_LENGTH,
  MIN_DRIVER_AGE,
  PERSONAL_FIELDS,
} from "../../validation/personalInfo";

// El selector no deja elegir fechas de menores de edad ni antes de 1900
const MIN_BIRTH_DATE = new Date(1900, 0, 1);

export default function PersonalInfoScreen() {
  const navigation = useNavigation();
  const { t, setLanguage } = useLanguage();
  const {
    formData,
    errors,
    handleChange,
    touchField,
    touchFields,
    isPersonalValid,
  } = useContext(RegistrationContext);

  const genderOptions = GENDER_VALUES.map((value) => ({
    value,
    label: t(`gender.${value}`),
  }));

  // Las listas, la foto y la fecha no tienen onBlur: se marcan como visitadas al elegir
  const handleSelect = (field, value) => {
    handleChange(field, value);
    touchField(field);
  };

  // El idioma elegido cambia la app de inmediato y queda guardado en AsyncStorage
  const handleLanguage = (value) => {
    handleSelect("language", value);
    setLanguage(value);
  };

  const handleNext = () => {
    touchFields(PERSONAL_FIELDS);
    if (isPersonalValid) navigation.navigate("Vehicle");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <PhotoField
        label={t("personal.profilePhoto")}
        uri={formData.profilePhoto}
        onChange={(uri) => handleSelect("profilePhoto", uri)}
        error={t(errors.profilePhoto)}
      />

      <FormField
        label={t("personal.name")}
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
        onBlur={() => touchField("name")}
        error={t(errors.name)}
        placeholder={t("personal.namePlaceholder")}
        autoCapitalize="words"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
      />

      <FormField
        label={t("personal.documentId")}
        value={formData.documentId}
        onChangeText={(text) => handleChange("documentId", text)}
        onBlur={() => touchField("documentId")}
        error={t(errors.documentId)}
        placeholder={t("personal.documentIdPlaceholder")}
        keyboardType="number-pad"
        maxLength={10}
      />

      <FormField
        label={t("personal.phone")}
        value={formData.phone}
        onChangeText={(text) => handleChange("phone", text)}
        onBlur={() => touchField("phone")}
        error={t(errors.phone)}
        placeholder={t("personal.phonePlaceholder")}
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={10}
      />

      <DateField
        label={t("personal.birthDate")}
        value={formData.birthDate}
        onChange={(date) => handleSelect("birthDate", date)}
        onBlur={() => touchField("birthDate")}
        error={t(errors.birthDate)}
        minimumDate={MIN_BIRTH_DATE}
        maximumDate={yearsAgo(MIN_DRIVER_AGE)}
      />

      <SelectField
        label={t("personal.gender")}
        value={formData.gender}
        options={genderOptions}
        onChange={(value) => handleSelect("gender", value)}
        error={t(errors.gender)}
      />

      <FormField
        label={t("personal.email")}
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        onBlur={() => touchField("email")}
        error={t(errors.email)}
        placeholder={t("personal.emailPlaceholder")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
      />

      <SelectField
        label={t("personal.language")}
        value={formData.language}
        options={LANGUAGE_OPTIONS}
        onChange={handleLanguage}
        error={t(errors.language)}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{t("common.next")}</Text>
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
