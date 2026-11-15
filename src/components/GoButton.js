// AI-assisted: see docs/AI_LOG.md #60
// Big round button of the home screen, like Uber's "GO": blue with a pulsing
// ring while offline (tap to go online), and white with a red square while
// online (tap to go offline). It does the same as the Available switch.
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";

export const GO_BUTTON_SIZE = 76;

export default function GoButton({ isOnline, disabled = false, onPress }) {
  const { t } = useLanguage();
  const [pulse] = useState(() => new Animated.Value(0));
  const showPulse = !isOnline && !disabled;

  // The ring grows and fades over and over while the driver is offline
  useEffect(() => {
    if (!showPulse) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    // Cleanup: stop the animation when the button changes or closes
    return () => loop.stop();
  }, [showPulse, pulse]);

  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }),
      },
    ],
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {showPulse && (
        <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
      )}
      <TouchableOpacity
        style={[
          styles.button,
          isOnline ? styles.buttonOnline : styles.buttonOffline,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isOnline ? t("home.goOffline") : t("home.goOnline")}
        accessibilityState={{ disabled }}
      >
        {isOnline ? (
          <View style={styles.stop} />
        ) : (
          <Text style={styles.goText}>{t("home.go")}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: GO_BUTTON_SIZE,
    height: GO_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: GO_BUTTON_SIZE,
    height: GO_BUTTON_SIZE,
    borderRadius: GO_BUTTON_SIZE / 2,
    backgroundColor: colors.link,
  },
  button: {
    width: GO_BUTTON_SIZE,
    height: GO_BUTTON_SIZE,
    borderRadius: GO_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonOffline: { backgroundColor: colors.link },
  buttonOnline: { backgroundColor: colors.white, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  goText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  stop: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
