// AI-assisted: see docs/AI_LOG.md #31
// Five stars for the driver to rate the passenger once the trip ends. It is
// saved in passengerRating (not in rating, which is the driver's own rating).
// After saving, the trip snapshot brings the value and the stars stay fixed.
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CONTROL_HEIGHT, colors, radius, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { ratePassenger } from "../services/tripRepository";
import { PASSENGER_RATING_FIELD } from "../services/trips";
import FieldMessage from "./FieldMessage";

const STARS = [1, 2, 3, 4, 5];

export default function PassengerRating({ trip }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const saved = trip[PASSENGER_RATING_FIELD] ?? null;
  const shown = saved ?? selected;

  const send = async () => {
    setError(null);
    setIsSending(true);
    try {
      await ratePassenger(trip, selected);
    } catch (rateError) {
      console.error("Error rating the passenger:", rateError.cause ?? rateError);
      setError(rateError.code ?? "trip.error.failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.block}>
      <Text style={styles.title}>
        {saved
          ? t("summary.ratedPassenger").replace("{stars}", saved)
          : t("summary.ratePassenger")}
      </Text>

      <View style={styles.stars} accessibilityRole="radiogroup">
        {STARS.map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              setSelected(star);
              setError(null);
            }}
            disabled={saved !== null || isSending}
            hitSlop={spacing.xs}
            accessibilityRole="radio"
            accessibilityState={{
              selected: shown === star,
              disabled: saved !== null,
            }}
            accessibilityLabel={t("summary.starLabel").replace("{stars}", star)}
          >
            <Text style={[styles.star, star <= shown && styles.starOn]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      {saved === null && selected > 0 && (
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.busy]}
          onPress={send}
          disabled={isSending}
          accessibilityRole="button"
          accessibilityState={{ busy: isSending }}
        >
          {isSending ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={colors.black} />
              <Text style={styles.sendText}>{t("summary.sendingRating")}</Text>
            </View>
          ) : (
            <Text style={styles.sendText}>{t("summary.sendRating")}</Text>
          )}
        </TouchableOpacity>
      )}
      <FieldMessage error={error ? t(error) : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  title: { ...typography.label, fontSize: 16, textAlign: "center" },
  stars: { flexDirection: "row", gap: spacing.md },
  star: { fontSize: 36, color: colors.border },
  starOn: { color: colors.black },
  sendButton: {
    alignSelf: "stretch",
    minHeight: CONTROL_HEIGHT - 8,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  busy: { borderColor: colors.border },
  busyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sendText: { ...typography.label, fontSize: 16 },
});
