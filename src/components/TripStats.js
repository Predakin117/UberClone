// AI-assisted: see docs/AI_LOG.md #60, #61
// Three tiles of a trip: duration, distance and payment method, each with
// its icon. Shared by the trip summary and the trip details of the history.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";

const Stat = ({ icon, label, value }) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={20} color={colors.black} />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

export default function TripStats({ trip, style }) {
  const { t } = useLanguage();

  return (
    <View style={[styles.stats, style]}>
      <Stat
        icon="time-outline"
        label={t("request.duration")}
        value={t("request.minutes").replace("{minutes}", trip.durationMin)}
      />
      <Stat
        icon="navigate-outline"
        label={t("request.distance")}
        value={t("request.km").replace("{km}", trip.distanceKm)}
      />
      <Stat
        icon={trip.paymentMethod === "cash" ? "cash-outline" : "card-outline"}
        label={t("summary.payment")}
        value={t(`payment.${trip.paymentMethod}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  value: { ...typography.label, fontSize: 15, marginTop: spacing.xs },
  label: typography.caption,
});
