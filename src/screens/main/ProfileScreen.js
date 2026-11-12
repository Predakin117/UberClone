// AI-assisted: see docs/AI_LOG.md #30
// Driver profile (section 3): photo, name, account status and average rating,
// then the personal details, the vehicle and the documents, read in real time
// from drivers/{uid}. The name, the profile photo and the Mercado Pago email
// can be edited with the registration rules; the rest is read-only because
// changing it requires a new approval.
import { Image } from "expo-image";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import PhotoField from "../../components/PhotoField";
import { colors, radius, spacing, typography } from "../../config/theme";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { updateDriverProfile } from "../../services/driverRepository";
import {
  expiryStatus,
  profileUpdate,
  profileValues,
} from "../../services/driverProfile";
import { formatDisplayDate } from "../../validation/dates";
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from "../../validation/personalInfo";
import { validateProfile } from "../../validation/profile";

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || ""}</Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// Expiry date of a document, with a warning if it expires in less than 30 days
const ExpiryRow = ({ label, expiry }) => {
  const { t } = useLanguage();
  const { state, daysLeft } = expiryStatus(expiry);
  let warning = null;
  if (state === "expired") warning = t("profile.expired");
  if (state === "soon") {
    warning =
      daysLeft === 0
        ? t("profile.expiresToday")
        : t("profile.expiresSoon").replace("{days}", daysLeft);
  }
  return (
    <View>
      <InfoRow label={label} value={formatDisplayDate(expiry ?? "")} />
      {warning && (
        <Text
          style={[
            styles.badge,
            state === "expired" ? styles.badgeExpired : styles.badgeSoon,
          ]}
        >
          {warning}
        </Text>
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { driverData, login } = useContext(AuthContext);
  const { driver, rating, isLoading, error } = useDriverProfile();
  // Only what the driver changed; the rest comes live from Firestore
  const [edits, setEdits] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  if (isLoading || error || !driver) {
    let message = t("profile.noRegistration");
    if (isLoading) message = t("profile.loading");
    if (error) message = t(error);
    return (
      <View style={styles.centered}>
        {isLoading && <ActivityIndicator color={colors.black} />}
        <Text style={[styles.centeredText, error && styles.errorText]}>
          {message}
        </Text>
      </View>
    );
  }

  const values = { ...profileValues(driver), ...edits };
  const errors = validateProfile(values);
  const update = profileUpdate(driver, values);
  const hasChanges = Object.keys(update).length > 0;
  // A field shows its error once it was edited, or after trying to save
  const fieldError = (field) =>
    (showErrors || edits[field] !== undefined) && errors[field]
      ? t(errors[field])
      : null;

  const setField = (field) => (value) => {
    setEdits((current) => ({ ...current, [field]: value }));
    setSaveError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0 || !hasChanges || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateDriverProfile(update);
      // The side menu greets the driver by name: keep its session up to date
      if (update["personal.name"] && driverData) {
        await login({ ...driverData, name: update["personal.name"] });
      }
      setEdits({});
      setShowErrors(false);
      setSaved(true);
    } catch (saveFailure) {
      console.error("Error saving the profile:", saveFailure.cause ?? saveFailure);
      setSaveError(saveFailure.code ?? "save.failed");
    } finally {
      setIsSaving(false);
    }
  };

  const { personal = {}, vehicle = {}, documents = {} } = driver;
  const status = driver.status ?? "draft";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {values.profilePhoto !== "" && (
            <Image
              source={{ uri: values.profilePhoto }}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
          <Text style={styles.name}>{personal.name}</Text>
          <Text
            style={[
              styles.status,
              status === "approved" && styles.statusApproved,
              status === "rejected" && styles.statusRejected,
            ]}
          >
            {t(`profile.status.${status}`)}
          </Text>
          <Text style={styles.caption}>
            {rating.average === null
              ? t("profile.noRating")
              : t("profile.rating")
                  .replace("{rating}", rating.average)
                  .replace("{count}", rating.count)}
          </Text>
        </View>

        <Section title={t("profile.personalSection")}>
          <PhotoField
            label={t("personal.profilePhoto")}
            uri={values.profilePhoto}
            onChange={setField("profilePhoto")}
            error={fieldError("profilePhoto")}
          />
          <FormField
            label={t("personal.name")}
            value={values.name}
            onChangeText={setField("name")}
            error={fieldError("name")}
            placeholder={t("personal.namePlaceholder")}
            autoCapitalize="words"
            maxLength={MAX_NAME_LENGTH}
            showLimit
          />
          <InfoRow label={t("personal.documentId")} value={personal.documentId} />
          <InfoRow label={t("personal.phone")} value={personal.phone} />
          <InfoRow label={t("personal.email")} value={personal.email} />
          <InfoRow
            label={t("personal.birthDate")}
            value={formatDisplayDate(personal.birthDate ?? "")}
          />
          <Text style={styles.note}>{t("profile.readOnlyNote")}</Text>
        </Section>

        <Section title={t("profile.vehicleSection")}>
          {vehicle.photoUrl ? (
            <Image
              source={{ uri: vehicle.photoUrl }}
              style={styles.vehiclePhoto}
              contentFit="cover"
            />
          ) : null}
          <InfoRow
            label={t("vehicle.category")}
            value={vehicle.category ? t(`category.${vehicle.category}`) : ""}
          />
          <InfoRow label={t("vehicle.plate")} value={vehicle.plate} />
          <InfoRow label={t("vehicle.make")} value={vehicle.make} />
          <InfoRow label={t("vehicle.model")} value={vehicle.model} />
          <InfoRow label={t("vehicle.year")} value={vehicle.year} />
          <InfoRow
            label={t("vehicle.color")}
            value={vehicle.color ? t(`color.${vehicle.color}`) : ""}
          />
          <InfoRow label={t("vehicle.capacity")} value={vehicle.capacity} />
          <Text style={styles.note}>{t("profile.readOnlyNote")}</Text>
        </Section>

        <Section title={t("profile.documentsSection")}>
          <Text style={styles.subTitle}>{t("documents.licenseSection")}</Text>
          <InfoRow
            label={t("documents.licenseNumber")}
            value={documents.license?.number}
          />
          <ExpiryRow
            label={t("documents.licenseExpiry")}
            expiry={documents.license?.expiry}
          />

          <Text style={styles.subTitle}>{t("documents.soatSection")}</Text>
          <ExpiryRow
            label={t("documents.soatExpiry")}
            expiry={documents.soat?.expiry}
          />

          <Text style={styles.subTitle}>{t("documents.techReviewSection")}</Text>
          {documents.techReview ? (
            <ExpiryRow
              label={t("documents.techReviewExpiry")}
              expiry={documents.techReview.expiry}
            />
          ) : (
            <Text style={styles.caption}>
              {t("documents.techReviewNotRequired").replace(
                "{year}",
                vehicle.year ?? "",
              )}
            </Text>
          )}
          <Text style={styles.note}>{t("profile.readOnlyNote")}</Text>
        </Section>

        <Section title={t("documents.paymentsSection")}>
          <FormField
            label={t("documents.mercadoPagoEmail")}
            value={values.mercadoPagoEmail}
            onChangeText={setField("mercadoPagoEmail")}
            error={fieldError("mercadoPagoEmail")}
            hint={t("documents.mercadoPagoEmailHint")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={MAX_EMAIL_LENGTH}
          />
        </Section>

        <NextButton
          label={t("profile.save")}
          onPress={handleSave}
          isSaving={isSaving}
          disabled={!hasChanges}
          error={saveError ? t(saveError) : null}
        />
        {saved && !hasChanges && (
          <Text style={styles.saved} accessibilityLiveRegion="polite">
            {t("profile.saved")}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  centeredText: { ...typography.subtitle, textAlign: "center" },
  errorText: { color: colors.error },
  header: { alignItems: "center", gap: spacing.xs },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  name: { ...typography.title, fontSize: 24, textAlign: "center" },
  status: {
    ...typography.label,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    overflow: "hidden",
  },
  statusApproved: { color: colors.white, backgroundColor: colors.black },
  statusRejected: { color: colors.error, backgroundColor: colors.errorBackground },
  caption: { ...typography.caption },
  section: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.section, marginBottom: spacing.xs },
  subTitle: { ...typography.label, marginTop: spacing.sm },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  infoLabel: { ...typography.caption, fontSize: 14, flexShrink: 1 },
  infoValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  badge: {
    ...typography.caption,
    alignSelf: "flex-end",
    fontWeight: "600",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: "hidden",
  },
  badgeSoon: { color: colors.warning, backgroundColor: colors.surface },
  badgeExpired: { color: colors.error, backgroundColor: colors.errorBackground },
  vehiclePhoto: {
    width: "100%",
    height: 160,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  note: { ...typography.caption, marginTop: spacing.xs },
  saved: { ...typography.label, textAlign: "center" },
});
