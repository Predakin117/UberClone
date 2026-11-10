// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #10, #12, #54
import { useContext } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import CheckboxField from "../../components/CheckboxField";
import DateField from "../../components/DateField";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import PhotoField from "../../components/PhotoField";
import { COMMISSION_RATE } from "../../config/pricing";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { addDays } from "../../validation/dates";
import {
  DOCUMENT_FIELDS,
  maxExpiryDate,
  requiresTechReview,
} from "../../validation/documents";
import { MAX_EMAIL_LENGTH } from "../../validation/personalInfo";

export default function DocumentsScreen() {
  const { t } = useLanguage();
  const {
    formData,
    errors,
    handleChange,
    touchField,
    touchFields,
    isPersonalValid,
    isVehicleValid,
    isDocsValid,
    canSubmit,
    submitRegistration,
    isSaving,
    saveError,
  } = useContext(RegistrationContext);

  // Los vencimientos deben ser posteriores a hoy: el selector empieza en mañana
  const tomorrow = addDays(new Date(), 1);
  const needsTechReview = requiresTechReview(formData.year);
  const hasVehicleYear = /^\d{4}$/.test(formData.year);

  // Las fotos, las fechas y la casilla no tienen onBlur: se marcan como visitadas al elegir
  const handleSelect = (field, value) => {
    handleChange(field, value);
    touchField(field);
  };

  // El botón Enviar está deshabilitado hasta que todo sea válido; esto dice qué falta
  const pendingTabs = [
    !isPersonalValid && t("tabs.personal"),
    !isVehicleValid && t("tabs.vehicle"),
    !isDocsValid && t("tabs.documents"),
  ].filter(Boolean);

  const commissionPercent = Math.round(COMMISSION_RATE * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>{t("documents.licenseSection")}</Text>
      <FormField
        label={t("documents.licenseNumber")}
        value={formData.licenseNumber}
        onChangeText={(text) => handleChange("licenseNumber", text)}
        onBlur={() => touchField("licenseNumber")}
        error={t(errors.licenseNumber)}
        placeholder={t("documents.licenseNumberPlaceholder")}
        keyboardType="number-pad"
        maxLength={15}
      />
      <PhotoField
        label={t("documents.licensePhoto")}
        uri={formData.licensePhoto}
        onChange={(uri) => handleSelect("licensePhoto", uri)}
        error={t(errors.licensePhoto)}
      />
      <DateField
        label={t("documents.licenseExpiry")}
        value={formData.licenseExpiry}
        onChange={(date) => handleSelect("licenseExpiry", date)}
        onBlur={() => touchField("licenseExpiry")}
        error={t(errors.licenseExpiry)}
        minimumDate={tomorrow}
        maximumDate={maxExpiryDate("license")}
        defaultDate={tomorrow}
      />

      <Text style={styles.sectionTitle}>{t("documents.soatSection")}</Text>
      <PhotoField
        label={t("documents.soatPhoto")}
        uri={formData.soatPhoto}
        onChange={(uri) => handleSelect("soatPhoto", uri)}
        error={t(errors.soatPhoto)}
      />
      <DateField
        label={t("documents.soatExpiry")}
        value={formData.soatExpiry}
        onChange={(date) => handleSelect("soatExpiry", date)}
        onBlur={() => touchField("soatExpiry")}
        error={t(errors.soatExpiry)}
        minimumDate={tomorrow}
        maximumDate={maxExpiryDate("soat")}
        defaultDate={tomorrow}
      />

      <Text style={styles.sectionTitle}>
        {t("documents.techReviewSection")}
      </Text>
      {needsTechReview ? (
        <>
          <PhotoField
            label={t("documents.techReviewPhoto")}
            uri={formData.techReviewPhoto}
            onChange={(uri) => handleSelect("techReviewPhoto", uri)}
            error={t(errors.techReviewPhoto)}
          />
          <DateField
            label={t("documents.techReviewExpiry")}
            value={formData.techReviewExpiry}
            onChange={(date) => handleSelect("techReviewExpiry", date)}
            onBlur={() => touchField("techReviewExpiry")}
            error={t(errors.techReviewExpiry)}
            minimumDate={tomorrow}
            maximumDate={maxExpiryDate("techReview")}
            defaultDate={tomorrow}
          />
        </>
      ) : (
        <Text style={styles.hint}>
          {hasVehicleYear
            ? t("documents.techReviewNotRequired").replace(
                "{year}",
                formData.year,
              )
            : t("documents.techReviewUnknownYear")}
        </Text>
      )}

      <Text style={styles.sectionTitle}>{t("documents.paymentsSection")}</Text>
      <FormField
        label={t("documents.mercadoPagoEmail")}
        value={formData.mercadoPagoEmail}
        onChangeText={(text) => handleChange("mercadoPagoEmail", text)}
        onBlur={() => touchField("mercadoPagoEmail")}
        error={t(errors.mercadoPagoEmail)}
        placeholder={t("personal.emailPlaceholder")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        maxLength={MAX_EMAIL_LENGTH}
        showLimit
      />
      <Text style={styles.hint}>{t("documents.mercadoPagoEmailHint")}</Text>

      <CheckboxField
        label={t("documents.terms").replace("{percent}", commissionPercent)}
        value={formData.acceptedTerms}
        onChange={(checked) => handleSelect("acceptedTerms", checked)}
        error={t(errors.acceptedTerms)}
      />

      {/* Botón condicionado a canSubmit. Al enviar se guardan las 3 pestañas,
          así que aquí se muestra el error de cualquiera de ellas */}
      <NextButton
        label={
          canSubmit ? t("documents.submit") : t("documents.completeAllTabs")
        }
        onPress={submitRegistration}
        disabled={!canSubmit}
        isSaving={isSaving}
        error={saveError && t(saveError.code)}
      />
      {pendingTabs.length > 0 && (
        <Text style={styles.hint}>
          {t("documents.pendingTabs").replace("{tabs}", pendingTabs.join(", "))}
        </Text>
      )}
      {!isDocsValid && (
        <TouchableOpacity
          onPress={() => touchFields(DOCUMENT_FIELDS)}
          accessibilityRole="button"
        >
          <Text style={styles.link}>{t("documents.showPending")}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  hint: { fontSize: 13, color: "#555", marginBottom: 15 },
  link: {
    fontSize: 14,
    color: "#1a56db",
    textDecorationLine: "underline",
    marginTop: 5,
  },
});
