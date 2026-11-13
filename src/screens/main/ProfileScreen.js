// AI-assisted: see docs/AI_LOG.md #30, #61
// Driver profile (section 3): photo, name, account status and average rating,
// then the personal details, the vehicle and the documents, read in real time
// from drivers/{uid}. The name, the profile photo and the Mercado Pago email
// can be edited with the registration rules; the rest is read-only because
// changing it requires a new approval.
// It looks like Uber's: a big photo (tap it for a new selfie), the status as
// a label, three stats (rating, trips and driver since), sections with icons
// and each document with a "Valid", "Expires soon" or "Expired" label.
import { Ionicons } from "@expo/vector-icons";
import { CameraType } from "expo-image-picker";
import { Image } from "expo-image";
import { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "../../components/Avatar";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import Skeleton, { SkeletonBox } from "../../components/Skeleton";
import { colors, radius, spacing, typography } from "../../config/theme";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { usePhotoPicker } from "../../hooks/usePhotoPicker";
import { formatMonthYear } from "../../i18n/format";
import { updateDriverProfile } from "../../services/driverRepository";
import {
  expiryStatus,
  profileUpdate,
  profileValues,
  submittedAtMillis,
} from "../../services/driverProfile";
import { formatDisplayDate } from "../../validation/dates";
import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
} from "../../validation/personalInfo";
import { validateProfile } from "../../validation/profile";

const AVATAR_SIZE = 112;
// Square crop, like the selfie of the registration
const CROP = { allowsEditing: true, aspect: [1, 1] };

// Icon and colors of the account status label
const STATUS_STYLES = {
  approved: {
    icon: "checkmark-circle",
    color: colors.success,
    background: colors.successBackground,
  },
  pending: {
    icon: "time-outline",
    color: colors.warning,
    background: colors.warningBackground,
  },
  rejected: {
    icon: "close-circle",
    color: colors.error,
    background: colors.errorBackground,
  },
  draft: {
    icon: "create-outline",
    color: colors.textSecondary,
    background: colors.surface,
  },
};

// Colors of the document labels, by expiryStatus
const EXPIRY_STYLES = {
  ok: { color: colors.success, background: colors.successBackground },
  soon: { color: colors.warning, background: colors.warningBackground },
  expired: { color: colors.error, background: colors.errorBackground },
};

const Chip = ({ icon, text, color, background }) => (
  <View style={[styles.chip, { backgroundColor: background }]}>
    {icon && <Ionicons name={icon} size={14} color={color} />}
    <Text style={[styles.chipText, { color }]}>{text}</Text>
  </View>
);

const Stat = ({ value, label, icon, accessibilityLabel }) => (
  <View
    style={styles.stat}
    accessible
    accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
  >
    <View style={styles.statValueRow}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {icon && <Ionicons name={icon} size={16} color={colors.black} />}
    </View>
    <Text style={styles.statLabel} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || ""}</Text>
  </View>
);

const Section = ({ icon, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={colors.black} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// A document with its expiry date and a label: valid, expires soon (less
// than 30 days) or expired. detail replaces the date when there is none.
const DocumentRow = ({ title, expiry, detail }) => {
  const { t } = useLanguage();
  const { state, daysLeft } = expiryStatus(expiry);
  let label = null;
  if (state === "ok") label = t("profile.docValid");
  if (state === "expired") label = t("profile.expired");
  if (state === "soon") {
    label =
      daysLeft === 0
        ? t("profile.expiresToday")
        : t("profile.expiresSoon").replace("{days}", daysLeft);
  }
  return (
    <View style={styles.documentRow}>
      <Ionicons name="document-text-outline" size={22} color={colors.black} />
      <View style={styles.documentTexts}>
        <Text style={styles.documentTitle}>{title}</Text>
        <Text style={styles.caption}>
          {detail ??
            t("profile.expiresOn").replace(
              "{date}",
              formatDisplayDate(expiry ?? ""),
            )}
        </Text>
      </View>
      {label && <Chip text={label} {...EXPIRY_STYLES[state]} />}
    </View>
  );
};

export default function ProfileScreen() {
  const { t, language } = useLanguage();
  const { driverData, login } = useContext(AuthContext);
  const { driver, rating, tripCount, isLoading, error } = useDriverProfile();
  // Only what the driver changed; the rest comes live from Firestore
  const [edits, setEdits] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  // A new selfie (front camera) or a photo from the gallery, like the
  // registration; it is saved with "Save changes"
  const { pick, errorKey: photoError } = usePhotoPicker((uri) => {
    setEdits((current) => ({ ...current, profilePhoto: uri }));
    setSaveError(null);
    setSaved(false);
  });

  if (isLoading) {
    return (
      <Skeleton
        label={t("profile.loading")}
        style={[styles.screen, styles.content]}
      >
        <View style={styles.header}>
          <SkeletonBox width={AVATAR_SIZE} height={AVATAR_SIZE} round />
          <SkeletonBox width={180} height={26} />
          <SkeletonBox width={140} height={26} round />
        </View>
        <SkeletonBox height={76} />
        <SkeletonBox height={220} />
        <SkeletonBox height={180} />
      </Skeleton>
    );
  }

  if (error || !driver) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.centeredText, error && styles.errorText]}>
          {error ? t(error) : t("profile.noRegistration")}
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
      console.error(
        "Error saving the profile:",
        saveFailure.cause ?? saveFailure,
      );
      setSaveError(saveFailure.code ?? "save.failed");
    } finally {
      setIsSaving(false);
    }
  };

  const { personal = {}, vehicle = {}, documents = {} } = driver;
  const status = driver.status ?? "draft";

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const photoMessage = t(photoError) || fieldError("profilePhoto");
  const memberSince = formatMonthYear(submittedAtMillis(driver), language);
  const vehicleName = [vehicle.make, vehicle.model].filter(Boolean).join(" ");

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
          <TouchableOpacity
            onPress={() =>
              pick("camera", { ...CROP, cameraType: CameraType.front })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t("profile.changePhoto")}
          >
            <Avatar uri={values.profilePhoto} size={AVATAR_SIZE} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={18} color={colors.white} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => pick("library", CROP)}
            hitSlop={spacing.sm}
            accessibilityRole="button"
          >
            <Text style={styles.link}>{t("photo.chooseFromGallery")}</Text>
          </TouchableOpacity>
          {photoMessage && (
            <Text style={styles.photoError}>{photoMessage}</Text>
          )}
          <Text style={styles.name}>{personal.name}</Text>
          <Chip
            icon={statusStyle.icon}
            text={t(`profile.status.${status}`)}
            color={statusStyle.color}
            background={statusStyle.background}
          />
        </View>

        <View style={styles.stats}>
          <Stat
            value={rating.average === null ? "–" : rating.average}
            icon={rating.average === null ? null : "star"}
            label={t("profile.statRating")}
            accessibilityLabel={
              rating.average === null
                ? t("profile.noRating")
                : t("profile.rating")
                    .replace("{rating}", rating.average)
                    .replace("{count}", rating.count)
            }
          />
          <View style={styles.statDivider} />
          <Stat value={tripCount} label={t("profile.statTrips")} />
          <View style={styles.statDivider} />
          <Stat value={memberSince || "–"} label={t("profile.statSince")} />
        </View>

        <Section icon="person-outline" title={t("profile.personalSection")}>
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
          <InfoRow
            label={t("personal.documentId")}
            value={personal.documentId}
          />
          <InfoRow label={t("personal.phone")} value={personal.phone} />
          <InfoRow label={t("personal.email")} value={personal.email} />
          <InfoRow
            label={t("personal.birthDate")}
            value={formatDisplayDate(personal.birthDate ?? "")}
          />
          <Text style={styles.note}>{t("profile.readOnlyNote")}</Text>
        </Section>

        <Section icon="car-outline" title={t("profile.vehicleSection")}>
          {vehicle.photoUrl ? (
            <Image
              source={{ uri: vehicle.photoUrl }}
              style={styles.vehiclePhoto}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.vehicleTitleRow}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicleName}
            </Text>
            {vehicle.plate ? (
              <View
                style={styles.plate}
                accessible
                accessibilityLabel={`${t("vehicle.plate")}: ${vehicle.plate}`}
              >
                <Text style={styles.plateText}>{vehicle.plate}</Text>
              </View>
            ) : null}
          </View>
          <InfoRow
            label={t("vehicle.category")}
            value={vehicle.category ? t(`category.${vehicle.category}`) : ""}
          />
          <InfoRow label={t("vehicle.year")} value={vehicle.year} />
          <InfoRow
            label={t("vehicle.color")}
            value={vehicle.color ? t(`color.${vehicle.color}`) : ""}
          />
          <InfoRow label={t("vehicle.capacity")} value={vehicle.capacity} />
          <Text style={styles.note}>{t("profile.readOnlyNote")}</Text>
        </Section>

        <Section
          icon="folder-open-outline"
          title={t("profile.documentsSection")}
        >
          <DocumentRow
            title={t("documents.licenseSection")}
            expiry={documents.license?.expiry}
          />
          <InfoRow
            label={t("documents.licenseNumber")}
            value={documents.license?.number}
          />
          <DocumentRow
            title={t("documents.soatSection")}
            expiry={documents.soat?.expiry}
          />
          {documents.techReview ? (
            <DocumentRow
              title={t("documents.techReviewSection")}
              expiry={documents.techReview.expiry}
            />
          ) : (
            <DocumentRow
              title={t("documents.techReviewSection")}
              detail={t("documents.techReviewNotRequired").replace(
                "{year}",
                vehicle.year ?? "",
              )}
            />
          )}
          <Text style={styles.note}>{t("profile.readOnlyNote")}</Text>
        </Section>

        <Section icon="card-outline" title={t("documents.paymentsSection")}>
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

const CAMERA_BADGE = 36;

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
  header: { alignItems: "center", gap: spacing.sm },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: CAMERA_BADGE,
    height: CAMERA_BADGE,
    borderRadius: CAMERA_BADGE / 2,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  link: { ...typography.label, color: colors.link },
  photoError: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
  },
  name: { ...typography.title, fontSize: 26, textAlign: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  statLabel: { ...typography.caption, textAlign: "center" },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.border,
  },
  caption: { ...typography.caption },
  section: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { ...typography.section, fontSize: 18 },
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
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  documentTexts: { flex: 1, gap: 2 },
  documentTitle: { ...typography.label, fontSize: 15 },
  vehiclePhoto: {
    width: "100%",
    height: 160,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  vehicleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  vehicleName: { ...typography.label, fontSize: 17, flexShrink: 1 },
  // Colombian plates are yellow with black letters
  plate: {
    backgroundColor: colors.plate,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: radius.sm / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  plateText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.black,
  },
  note: { ...typography.caption, marginTop: spacing.xs },
  saved: { ...typography.label, textAlign: "center" },
});
