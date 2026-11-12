// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #10, #12, #13, #54, #56
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CheckboxField from "../../components/CheckboxField";
import DateField from "../../components/DateField";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import PhotoField from "../../components/PhotoField";
import StepLayout from "../../components/StepLayout";
import { COMMISSION_RATE } from "../../config/pricing";
import { colors, radius, spacing, typography } from "../../config/theme";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { addDays } from "../../validation/dates";
import {
  DOCUMENT_FIELDS,
  maxExpiryDate,
  requiresTechReview,
} from "../../validation/documents";
import { MAX_EMAIL_LENGTH } from "../../validation/personalInfo";

// Title of each section; the ones after the first have a divider on top
const Section = ({ title, first = false, children }) => (
  <View style={[styles.section, first && styles.firstSection]}>
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    {children}
  </View>
);

export default function DocumentsScreen() {
  const navigation = useNavigation();
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
    <StepLayout
      title={t("register.title.Documents")}
      subtitle={t("register.subtitle.Documents")}
      footer={
        <>
          {/* Botón condicionado a canSubmit. Antes de guardar se confirma el correo con
              un código (VerifyEmailScreen), que es la que envía el registro */}
          <NextButton
            label={
              canSubmit ? t("documents.submit") : t("documents.completeAllTabs")
            }
            onPress={() => navigation.navigate("VerifyEmail")}
            disabled={!canSubmit}
            isSaving={isSaving}
            error={saveError && t(saveError.code)}
            style={styles.footerButton}
          />
          {pendingTabs.length > 0 && (
            <View style={styles.pendingRow}>
              <Text style={styles.pendingText}>
                {t("documents.pendingTabs").replace(
                  "{tabs}",
                  pendingTabs.join(", "),
                )}
              </Text>
              {!isDocsValid && (
                <TouchableOpacity
                  onPress={() => touchFields(DOCUMENT_FIELDS)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={styles.link}>{t("documents.showPending")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      }
    >
      <Section title={t("documents.licenseSection")} first>
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
      </Section>

      <Section title={t("documents.soatSection")}>
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
      </Section>

      <Section title={t("documents.techReviewSection")}>
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
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {hasVehicleYear
                ? t("documents.techReviewNotRequired").replace(
                    "{year}",
                    formData.year,
                  )
                : t("documents.techReviewUnknownYear")}
            </Text>
          </View>
        )}
      </Section>

      <Section title={t("documents.paymentsSection")}>
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
      </Section>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: spacing.xl,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  firstSection: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  sectionTitle: { ...typography.section, marginBottom: spacing.lg },
  hint: {
    ...typography.caption,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoText: { ...typography.caption, color: colors.textPrimary },
  footerButton: { marginTop: 0 },
  pendingRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  pendingText: { ...typography.caption, flexShrink: 1 },
  link: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.link,
    textDecorationLine: "underline",
  },
});
