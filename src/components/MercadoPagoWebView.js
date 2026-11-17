// Mercado Pago inside the app (section 4 allows react-native-webview or the
// browser): a full screen with a close button on top and the Mercado Pago
// page below, so the driver never leaves the app. When the page reaches
// returnPath (the backend's page after paying or after linking the account),
// it closes by itself. The Android back button goes back one page, or closes
// this screen on the first page; it never closes the app. Links that would
// open another app (exp://, intent://, mercadopago://…) are not followed.
//
// The parent mounts it with key={url} for each new page and calls onClose
// with "returned" (Mercado Pago came back) or "closed" (the driver closed it).
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { colors, spacing, typography } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";

const CLOSE_SIZE = 40;

// Only web pages load here; app links would take the driver out of the app
const isWebPage = (url) => /^https?:\/\//i.test(url ?? "");

export default function MercadoPagoWebView({ url, returnPath, onClose }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  // Closes once, even if the page reports the same URL more than once
  const hasClosed = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const close = (reason) => {
    if (hasClosed.current) return;
    hasClosed.current = true;
    onClose(reason);
  };

  // Android back button: one page back, or close on the first page
  const handleBack = () => {
    if (canGoBack) webViewRef.current?.goBack();
    else close("closed");
  };

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={handleBack}
      statusBarTranslucent
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.close}
            onPress={() => close("closed")}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel={t("mpWeb.close")}
          >
            <Ionicons name="close" size={24} color={colors.black} />
          </TouchableOpacity>
          <View style={styles.titles}>
            <Text style={styles.title}>{t("mpWeb.title")}</Text>
            <View style={styles.secureRow}>
              <Ionicons name="lock-closed" size={12} color={colors.success} />
              <Text style={styles.secure}>{t("mpWeb.secure")}</Text>
            </View>
          </View>
          {/* Same width as the close button, to center the title */}
          <View style={styles.close} />
        </View>

        <View style={styles.page}>
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            onShouldStartLoadWithRequest={(request) => isWebPage(request.url)}
            // Links that open a new window load here instead
            setSupportMultipleWindows={false}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onNavigationStateChange={(state) => {
              setCanGoBack(state.canGoBack);
              // The backend's page loaded: the payment or the link is done
              if (!state.loading && state.url?.includes(returnPath)) {
                close("returned");
              }
            }}
          />
          {isLoading && (
            <View style={styles.loading} pointerEvents="none">
              <ActivityIndicator color={colors.black} />
              <Text style={styles.loadingText}>{t("mpWeb.loading")}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: { flex: 1, alignItems: "center", gap: 2 },
  title: { ...typography.label, fontSize: 16 },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  secure: { ...typography.caption, fontSize: 12 },
  page: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: typography.caption,
});
