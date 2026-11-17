// AI-assisted: see docs/AI_LOG.md #63, #64
// Split payments on the profile (optional bonus of section 4): the driver
// links their own Mercado Pago account. Then Mercado Pago pays the driver's
// part of each trip straight to that account and the commission to the
// platform. Linking opens the Mercado Pago page inside the app
// (MercadoPagoWebView); when it closes, the state is read again. If the
// backend has no split payments, nothing is shown.
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
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
  getMercadoPagoLink,
  linkMercadoPagoAccount,
  unlinkMercadoPagoAccount,
} from "../services/payments";
import FieldMessage from "./FieldMessage";
import MercadoPagoWebView from "./MercadoPagoWebView";

// The backend's page after the driver authorizes (the OAuth redirect URL)
const RETURN_PATH = "/pagos/mercadopago/oauth";

export default function MercadoPagoLink() {
  const { t } = useLanguage();
  const [link, setLink] = useState({ available: false, linked: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  // The Mercado Pago authorization page while it is open inside the app
  const [linkUrl, setLinkUrl] = useState(null);

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

  const connect = async () => {
    setError(null);
    setIsBusy(true);
    const result = await linkMercadoPagoAccount();
    setIsBusy(false);
    if (!result.ok) {
      setError(`payment.error.${result.codigoError}`);
      return;
    }
    setLinkUrl(result.url);
  };

  // Mercado Pago came back, or the driver closed it: read the state again
  const closeLink = () => {
    setLinkUrl(null);
    refresh();
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
      {linkUrl && (
        <MercadoPagoWebView
          key={linkUrl}
          url={linkUrl}
          returnPath={RETURN_PATH}
          onClose={closeLink}
        />
      )}
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
