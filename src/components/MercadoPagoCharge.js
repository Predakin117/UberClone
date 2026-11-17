// AI-assisted: see docs/AI_LOG.md #62
// Charge of a Mercado Pago trip on the trip summary (section 4): the backend
// creates the Checkout Pro preference, the app opens it in the browser and the
// passenger pays with a test card. The result reaches the trip from the
// backend (webhook or check) and the summary sees it in real time; this
// component never writes the payment.
//
// The checkout opens in an auth session of the in-app browser with the app's
// own link (exp://… in Expo Go, uberclonedriver://… in a build). After
// paying, the backend's return page opens that link, so the browser closes
// by itself and the driver is back in the summary without leaving the app.
// When the session ends (back in the app, or the browser closed by hand),
// the payment is checked.
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
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

  const check = useCallback(async () => {
    setError(null);
    setStep("checking");
    const result = await checkMercadoPagoPayment(trip.id);
    setStep(null);
    if (!result.ok) setError(`payment.error.${result.codigoError}`);
  }, [trip.id]);

  const charge = async () => {
    setError(null);
    setStep("opening");
    // The app's link: Mercado Pago's return page comes back to it
    const returnUrl = Linking.createURL("mercadopago");
    const result = await startMercadoPagoPayment(trip, returnUrl);
    if (!result.ok) {
      setStep(null);
      setError(`payment.error.${result.codigoError}`);
      return;
    }
    setCheckoutOpened(true);
    try {
      // Ends when the return page opens the app, or when the driver closes
      // the browser; either way the payment is checked right after
      await WebBrowser.openAuthSessionAsync(result.url, returnUrl);
      await check();
    } catch (browserError) {
      console.error("Error opening Mercado Pago:", browserError);
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
