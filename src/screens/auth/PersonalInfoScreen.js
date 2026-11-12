// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #9, #10, #54, #56, #58
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { StyleSheet } from "react-native";
import DateField from "../../components/DateField";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import ProfilePhotoRow from "../../components/ProfilePhotoRow";
import SelectField from "../../components/SelectField";
import StepLayout from "../../components/StepLayout";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { yearsAgo } from "../../validation/dates";
import {
  GENDER_VALUES,
  LANGUAGE_OPTIONS,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MIN_DRIVER_AGE,
  isOnlyProfilePhotoMissing,
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
    lockedFields,
    isPersonalValid,
    saveSection,
    isSaving,
    saveError,
  } = useContext(RegistrationContext);

  // AI-assisted: see docs/AI_LOG.md #54
  // Email and phone of the account: shown filled in and grayed out
  const isLocked = (field) => lockedFields.includes(field);

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

  const openSelfie = () => navigation.navigate("ProfilePhoto");

  // Si la pestaña es válida se guarda en Firestore y solo entonces se avanza
  const handleNext = async () => {
    if (!isPersonalValid) {
      // AI-assisted: see docs/AI_LOG.md #58
      // Like Uber, the selfie comes last: if the photo is the only thing
      // missing, Next opens the selfie step instead of showing an error
      if (isOnlyProfilePhotoMissing(formData)) {
        openSelfie();
        return;
      }
      touchFields(PERSONAL_FIELDS);
      return;
    }
    if (await saveSection("personal")) navigation.navigate("Vehicle");
  };

  return (
    <StepLayout
      title={t("register.title.PersonalInfo")}
      subtitle={t("register.subtitle.PersonalInfo")}
      footer={
        <NextButton
          label={t("common.next")}
          onPress={handleNext}
          isSaving={isSaving}
          error={saveError?.section === "personal" && t(saveError.code)}
          style={styles.footerButton}
        />
      }
    >
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
        showLimit
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
        // The account number is international (+57…): no limit when locked
        maxLength={isLocked("phone") ? undefined : 10}
        editable={!isLocked("phone")}
        hint={isLocked("phone") ? t("personal.fromAccount") : undefined}
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
        maxLength={MAX_EMAIL_LENGTH}
        showLimit
        editable={!isLocked("email")}
        hint={isLocked("email") ? t("personal.fromAccount") : undefined}
        autoCorrect={false}
      />

      <SelectField
        label={t("personal.language")}
        value={formData.language}
        options={LANGUAGE_OPTIONS}
        onChange={handleLanguage}
        error={t(errors.language)}
      />

      {/* AI-assisted: see docs/AI_LOG.md #58 */}
      <ProfilePhotoRow
        label={t("personal.profilePhoto")}
        uri={formData.profilePhoto}
        onPress={openSelfie}
        error={t(errors.profilePhoto)}
      />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  footerButton: { marginTop: 0 },
});
