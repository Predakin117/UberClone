// AI-assisted: see docs/AI_LOG.md #60
// "Finding trips…" with a blue segment that slides back and forth, like the
// bar Uber shows while the driver is online and waiting for a request.
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../config/theme";

// Width of the moving segment, as a share of the track
const SEGMENT = 0.35;

export default function SearchingBar({ label }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const slide = (toValue) =>
      Animated.timing(progress, {
        toValue,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([slide(1), slide(0)]));
    loop.start();
    // Cleanup: stop the animation when the driver goes offline
    return () => loop.stop();
  }, [progress]);

  const segmentWidth = trackWidth * SEGMENT;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(trackWidth - segmentWidth, 0)],
  });

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.label}>{label}</Text>
      <View
        style={styles.track}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.segment,
            { width: segmentWidth, transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.label, textAlign: "center" },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  segment: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.link,
  },
});
