// AI-assisted: see docs/AI_LOG.md #64
// Floating notice, like Uber's: a black pill that slides in from the top,
// stays 2.5 seconds and leaves by itself ("Changes saved", "Payment
// approved"). The screen shows it with a message and clears it in onHide.
// tone "success" shows a green check; "error" a red cross.
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../config/theme";

const VISIBLE_MS = 2500;

export default function Toast({ message, tone = "success", top = 0, onHide }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const show = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);
    show.start(({ finished }) => {
      if (finished) onHide?.();
    });
    // Cleanup: stop the animation if the screen closes first
    return () => show.stop();
  }, [progress, onHide]);

  const isError = tone === "error";

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          top: top + spacing.md,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons
        name={isError ? "close-circle" : "checkmark-circle"}
        size={20}
        color={isError ? colors.error : colors.success}
      />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: "90%",
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 10,
    elevation: 10,
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  text: { color: colors.white, fontSize: 15, fontWeight: "600", flexShrink: 1 },
});
