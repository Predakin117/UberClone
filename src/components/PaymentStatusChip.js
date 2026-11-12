// AI-assisted: see docs/AI_LOG.md #60
// Payment status of a trip as a colored label: green when it was paid,
// orange while it waits and red if it was declined. The text is the same one
// as the trip summary (paymentStatusKey).
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { paymentStatusKey } from "../services/trips";

const TONES = {
  "summary.paymentStatus.approved": "success",
  "summary.paymentStatus.cashReceived": "success",
  "summary.paymentStatus.rejected": "error",
};

const TONE_STYLES = {
  success: { backgroundColor: colors.successBackground, color: colors.success },
  warning: { backgroundColor: colors.warningBackground, color: colors.warning },
  error: { backgroundColor: colors.errorBackground, color: colors.error },
};

export default function PaymentStatusChip({ trip }) {
  const { t } = useLanguage();
  const key = paymentStatusKey(trip);
  const tone = TONE_STYLES[TONES[key] ?? "warning"];

  return (
    <View style={[styles.chip, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.text, { color: tone.color }]} numberOfLines={1}>
        {t(key)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
  },
  text: { fontSize: 12, fontWeight: "700" },
});
