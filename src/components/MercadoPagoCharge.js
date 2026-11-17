// AI-assisted: see docs/AI_LOG.md #62
// Charge of a Mercado Pago trip on the trip summary (section 4): the backend
// creates the Checkout Pro preference, the app opens it in the browser and the
// passenger pays with a test card. The result reaches the trip from the
// backend (webhook or check) and the summary sees it in real time; this
// component never writes the payment.
//
// On Android openBrowserAsync answers as soon as the browser opens, so the
// payment is checked when the app comes back to the front (AppState). On iOS
// it answers when the browser closes.
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
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
import {
  checkMercadoPagoPayment,
  startMercadoPagoPayment,
} from "../services/payments";
import FieldMessage from "./FieldMessage";

export default function MercadoPagoCharge({ trip }) {
  const { t } = useLanguage();
  // null, "opening" (creating the checkout) or "checking" (asking the backend)
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  // true while the checkout is open on Android, to check when the app is back
  const waitingReturn = useRef(false);

  const check = useCallback(async () => {
    setError(null);
    setStep("checking");
    const result = await checkMercadoPagoPayment(trip.id);
    setStep(null);
    if (!result.ok) setError(`payment.error.${result.codigoError}`);
  }, [trip.id]);

  // Cleanup: stop listening to the app state when the summary closes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && waitingReturn.current) {
        waitingReturn.current = false;
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);

  const charge = async () => {
    setError(null);
    setStep("opening");
    const result = await startMercadoPagoPayment(trip);
    if (!result.ok) {
      setStep(null);
      setError(`payment.error.${result.codigoError}`);
      return;
    }
    setCheckoutOpened(true);
    try {
      waitingReturn.current = true;
      const browser = await WebBrowser.openBrowserAsync(result.url);
      setStep(null);
      // iOS: the browser already closed, check now
      if (browser.type !== "opened") {
        waitingReturn.current = false;
        await check();
      }
    } catch (browserError) {
      console.error("Error opening Mercado Pago:", browserError);
      waitingReturn.current = false;
      setStep(null);
      setError("payment.error.fallo");
    }
  };

  const isBusy = step !== null;
  const wasRejected = trip.paymentStatus === "rejected";
  const canCheck = checkoutOpened || Boolean(trip.paymentId);

  let label = wasRejected
    ? t("summary.retryMercadoPago")
    : t("summary.chargeMercadoPago");
  if (step === "opening") label = t("summary.openingCheckout");
  if (step === "checking") label = t("summary.checkingPayment");

  return (
    <View style={styles.block}>
      <TouchableOpacity
        style={[styles.button, isBusy && styles.busy]}
        onPress={charge}
        disabled={isBusy}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ disabled: isBusy, busy: isBusy }}
      >
        {isBusy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Ionicons name="card-outline" size={22} color={colors.white} />
        )}
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
      <FieldMessage error={error ? t(error) : null} />
      <Text style={styles.hint}>{t("summary.mercadoPagoHint")}</Text>
      {canCheck && (
        <TouchableOpacity
          onPress={check}
          disabled={isBusy}
          hitSlop={spacing.sm}
          accessibilityRole="button"
        >
          <Text style={[styles.link, isBusy && styles.linkBusy]}>
            {t("summary.checkPayment")}
          </Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: colors.mercadoPago,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  busy: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  hint: { ...typography.caption, textAlign: "center" },
  link: { ...typography.label, color: colors.link, textAlign: "center" },
  linkBusy: { color: colors.disabledText },
});
