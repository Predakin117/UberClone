// Cash payment on the trip summary (section 4): the passenger pays the
// driver, and the driver confirms with "I received the cash". The backend
// leaves the trip "paid"; the commission comes out of the driver's balance.
// The same logic as before, moved out of the summary so it sits in the
// "Collect" block with the same look as the Mercado Pago button.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CONTROL_HEIGHT,
  colors,
  radius,
  spacing,
  typography,
} from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import { markCashReceived } from "../services/payments";
import FieldMessage from "./FieldMessage";

export default function CashCharge({ trip, onPaid }) {
  const { t } = useLanguage();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);

  const confirmCash = async () => {
    setError(null);
    setIsConfirming(true);
    const result = await markCashReceived(trip.id);
    setIsConfirming(false);
    // On success the snapshot brings status "paid" and the button goes away
    if (result.ok) onPaid?.();
    else setError(`payment.error.${result.codigoError}`);
  };

  return (
    <View style={styles.block}>
      <TouchableOpacity
        style={[styles.button, isConfirming && styles.busy]}
        onPress={confirmCash}
        disabled={isConfirming}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ disabled: isConfirming, busy: isConfirming }}
      >
        {isConfirming ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Ionicons name="cash-outline" size={22} color={colors.white} />
        )}
        <Text style={styles.buttonText}>
          {isConfirming
            ? t("summary.confirmingCash")
            : t("summary.cashReceived")}
        </Text>
      </TouchableOpacity>
      <FieldMessage error={error ? t(error) : null} />
      <Text style={styles.hint}>{t("summary.cashHint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  button: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  busy: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  hint: { ...typography.caption, textAlign: "center" },
});
