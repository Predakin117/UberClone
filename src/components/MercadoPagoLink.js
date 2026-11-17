// AI-assisted: see docs/AI_LOG.md #63
// Split payments on the profile (optional bonus of section 4): the driver
// links their own Mercado Pago account. Then Mercado Pago pays the driver's
// part of each trip straight to that account and the commission to the
// platform. Linking opens the Mercado Pago page in the browser; when the app
// comes back to the front (AppState), the state is read again. If the backend
// has no split payments, nothing is shown.
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
  getMercadoPagoLink,
  linkMercadoPagoAccount,
  unlinkMercadoPagoAccount,
} from "../services/payments";
import FieldMessage from "./FieldMessage";

export default function MercadoPagoLink() {
  const { t } = useLanguage();
  const [link, setLink] = useState({ available: false, linked: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  // true while the Mercado Pago page is open, to read the state on return
  const waitingReturn = useRef(false);

  const refresh = useCallback(async () => {
    const result = await getMercadoPagoLink();
    setIsLoading(false);
    if (result.ok) {
      setLink({ available: result.available, linked: result.linked });
    } else {
      setError(`payment.error.${result.codigoError}`);
    }
  }, []);

  // The first read when the profile opens
  useEffect(() => {
    let isActive = true;
    getMercadoPagoLink().then((result) => {
      // Cleanup: no state changes after the profile closes
      if (!isActive) return;
      setIsLoading(false);
      if (result.ok) {
        setLink({ available: result.available, linked: result.linked });
      } else {
        setError(`payment.error.${result.codigoError}`);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  // Cleanup: stop listening to the app state when the profile closes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && waitingReturn.current) {
        waitingReturn.current = false;
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const connect = async () => {
    setError(null);
    setIsBusy(true);
    const result = await linkMercadoPagoAccount();
    if (!result.ok) {
      setIsBusy(false);
      setError(`payment.error.${result.codigoError}`);
      return;
    }
    try {
      waitingReturn.current = true;
      const browser = await WebBrowser.openBrowserAsync(result.url);
      // iOS: the browser already closed, read the state now
      if (browser.type !== "opened") {
        waitingReturn.current = false;
        await refresh();
      }
    } catch (browserError) {
      console.error("Error opening Mercado Pago:", browserError);
      waitingReturn.current = false;
      setError("payment.error.fallo");
    } finally {
      setIsBusy(false);
    }
  };

  const disconnect = async () => {
    setError(null);
    setIsBusy(true);
    const result = await unlinkMercadoPagoAccount();
    setIsBusy(false);
    if (result.ok) setLink((current) => ({ ...current, linked: false }));
    else setError(`payment.error.${result.codigoError}`);
  };

  if (isLoading) {
    return <ActivityIndicator color={colors.black} style={styles.loading} />;
  }
  // The backend has no split payments: nothing to link
  if (!link.available && !error) return null;

  return (
    <View style={styles.block}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t("split.title")}</Text>
        {link.linked && (
          <View style={styles.chip}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.success}
            />
            <Text style={styles.chipText}>{t("split.linked")}</Text>
          </View>
        )}
      </View>
      <Text style={styles.text}>
        {link.linked ? t("split.linkedText") : t("split.unlinkedText")}
      </Text>

      {link.available && !link.linked && (
        <TouchableOpacity
          style={[styles.button, isBusy && styles.busy]}
          onPress={connect}
          disabled={isBusy}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy, busy: isBusy }}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Ionicons name="link-outline" size={20} color={colors.white} />
          )}
          <Text style={styles.buttonText}>{t("split.link")}</Text>
        </TouchableOpacity>
      )}
      {link.linked && (
        <TouchableOpacity
          onPress={disconnect}
          disabled={isBusy}
          hitSlop={spacing.sm}
          accessibilityRole="button"
        >
          <Text style={[styles.unlink, isBusy && styles.busy]}>
            {t("split.unlink")}
          </Text>
        </TouchableOpacity>
      )}
      <FieldMessage error={error ? t(error) : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { alignSelf: "flex-start", marginVertical: spacing.sm },
  block: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: { ...typography.label, fontSize: 15, flexShrink: 1 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.successBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.success },
  text: { ...typography.caption, fontSize: 14 },
  button: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: CONTROL_HEIGHT - 4,
    borderRadius: radius.pill,
    backgroundColor: colors.mercadoPago,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  busy: { opacity: 0.6 },
  unlink: { ...typography.label, color: colors.error },
});
