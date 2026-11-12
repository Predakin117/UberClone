// AI-assisted: see docs/AI_LOG.md #59
// Last step of the registration, like Uber: the registration was saved as
// "Pending approval", so it shows the review progress and the documents under
// review. "Go to home" (or the back button) opens the main menu with the
// pending account, which can't go online until it is approved.
import { useRoute } from "@react-navigation/native";
import { useCallback, useContext, useEffect, useState } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/Avatar";
import NextButton from "../../components/NextButton";
import StepIcon from "../../components/StepIcon";
import { colors, radius, spacing, typography } from "../../config/theme";
import { AuthContext } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";
import { formatDisplayDate } from "../../validation/dates";
import { requiresTechReview } from "../../validation/documents";

// Review progress: sent (done), document review (now) and approval (next)
const STEPS = [
  { key: "submitted.stepSent", state: "done" },
  { key: "submitted.stepReview", state: "current" },
  { key: "submitted.stepApproved", state: "next" },
];

export default function RegistrationSubmittedScreen() {
  const { uid } = useRoute().params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { login } = useContext(AuthContext);
  const { formData } = useContext(RegistrationContext);
  const [isEntering, setIsEntering] = useState(false);

  // Same session data the registration used before this screen existed
  const goHome = useCallback(() => {
    setIsEntering(true);
    login({ id: uid, name: formData.name, status: "pending" });
  }, [login, uid, formData.name]);

  // The registration is already sent: going back means going home, not to
  // the email code again
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goHome();
        return true;
      },
    );
    return () => subscription.remove();
  }, [goHome]);

  const expires = (date) =>
    t("submitted.expires").replace("{date}", formatDisplayDate(date));

  // The documents the driver sent, each one "In review"
  const documents = [
    {
      key: "personal",
      title: t("submitted.personal"),
      detail: formData.name,
      icon: <Avatar uri={formData.profilePhoto} size={ICON_SIZE} />,
    },
    {
      key: "vehicle",
      title: t("submitted.vehicle"),
      detail: `${formData.plate.toUpperCase()} · ${formData.vehicleMake} ${formData.vehicleModel}`,
      icon: <StepIcon name="Vehicle" color={colors.white} />,
    },
    {
      key: "license",
      title: t("submitted.license"),
      detail: expires(formData.licenseExpiry),
      icon: <StepIcon name="Documents" color={colors.white} />,
    },
    {
      key: "soat",
      title: t("submitted.soat"),
      detail: expires(formData.soatExpiry),
      icon: <StepIcon name="Documents" color={colors.white} />,
    },
    // Only when the vehicle's year requires it (same rule as tab 3)
    requiresTechReview(formData.year) && {
      key: "techReview",
      title: t("submitted.techReview"),
      detail: expires(formData.techReviewExpiry),
      icon: <StepIcon name="Documents" color={colors.white} />,
    },
    {
      key: "mercadoPago",
      title: t("submitted.mercadoPago"),
      detail: formData.mercadoPagoEmail,
      icon: <Text style={styles.iconText}>$</Text>,
    },
  ].filter(Boolean);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl },
        ]}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeCheck}>✓</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {t("submitted.title")}
        </Text>
        <Text style={styles.subtitle}>{t("submitted.subtitle")}</Text>

        {/* Review progress */}
        <View style={styles.timeline}>
          {STEPS.map((step, index) => (
            <View key={step.key} style={styles.timelineRow}>
              <View style={styles.timelineMarker}>
                <View style={[styles.dot, styles[`dot_${step.state}`]]}>
                  {step.state === "done" && (
                    <Text style={styles.dotCheck}>✓</Text>
                  )}
                </View>
                {index < STEPS.length - 1 && <View style={styles.connector} />}
              </View>
              <Text
                style={[
                  styles.timelineText,
                  step.state === "next" && styles.timelineTextNext,
                ]}
              >
                {t(step.key)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>{t("submitted.documentsTitle")}</Text>
        <View style={styles.card}>
          {documents.map((item, index) => (
            <View
              key={item.key}
              style={[styles.row, index > 0 && styles.rowDivider]}
            >
              <View style={styles.icon}>{item.icon}</View>
              <View style={styles.rowTexts}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDetail} numberOfLines={1}>
                  {item.detail}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{t("submitted.inReview")}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.notice}>{t("submitted.notice")}</Text>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <NextButton
          label={t("submitted.goHome")}
          onPress={goHome}
          isSaving={isEntering}
          loadingLabel={t("submitted.goHome")}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const ICON_SIZE = 40;
const BADGE_SIZE = 64;
const DOT_SIZE = 22;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl - 4,
    paddingBottom: spacing.xxl,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  badgeCheck: { color: colors.white, fontSize: 30, fontWeight: "700" },
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, marginBottom: spacing.xl },
  timeline: { marginBottom: spacing.xl },
  timelineRow: { flexDirection: "row", gap: spacing.md },
  timelineMarker: { alignItems: "center", width: DOT_SIZE },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot_done: { backgroundColor: colors.success },
  dot_current: {
    backgroundColor: colors.white,
    borderWidth: 6,
    borderColor: colors.black,
  },
  dot_next: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotCheck: { color: colors.white, fontSize: 12, fontWeight: "700" },
  connector: {
    width: 2,
    height: spacing.xl,
    backgroundColor: colors.border,
  },
  timelineText: {
    ...typography.body,
    fontWeight: "600",
    lineHeight: DOT_SIZE,
  },
  timelineTextNext: { color: colors.textSecondary, fontWeight: "400" },
  section: { ...typography.section, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  rowTexts: { flex: 1, gap: 2 },
  rowTitle: { ...typography.label, fontSize: 15 },
  rowDetail: typography.caption,
  pill: {
    backgroundColor: colors.warningBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
  },
  pillText: { color: colors.warning, fontSize: 12, fontWeight: "700" },
  notice: { ...typography.caption, marginTop: spacing.lg },
  footer: {
    paddingHorizontal: spacing.xl - 4,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  button: { marginTop: 0 },
});
