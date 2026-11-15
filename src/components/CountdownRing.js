// AI-assisted: see docs/AI_LOG.md #60
// Ring that empties as the time runs out, like the circle around Uber's
// accept button. progress is an Animated.Value from 1 (full) to 0 (empty);
// the children go in the middle.
//
// Without react-native-svg (not installed) the ring is drawn with two halves:
// each half is a circle with only its top and right borders colored (a half
// ring), clipped to one side of the circle and turned with Animated, so the
// colored arc starts at 12 o'clock and shrinks counterclockwise.
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../config/theme";

export default function CountdownRing({
  progress,
  size = 128,
  strokeWidth = 6,
  color = colors.black,
  trackColor = colors.surface,
  children,
}) {
  const circle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: strokeWidth,
  };
  const halfRing = [
    styles.halfRing,
    circle,
    { borderTopColor: color, borderRightColor: color },
  ];

  // Angles: 45deg shows the right half, 225deg the left half. From 1 to 0.5
  // only the left half empties; from 0.5 to 0, the right half.
  const rightRotation = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-135deg", "45deg", "45deg"],
    extrapolate: "clamp",
  });
  const leftRotation = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["45deg", "45deg", "225deg"],
    extrapolate: "clamp",
  });

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.track, circle, { borderColor: trackColor }]} />

      {/* Right half of the circle */}
      <View
        style={[styles.clip, { left: size / 2, width: size / 2, height: size }]}
      >
        <Animated.View
          style={[
            halfRing,
            { left: -size / 2, transform: [{ rotate: rightRotation }] },
          ]}
        />
      </View>

      {/* Left half of the circle */}
      <View style={[styles.clip, { left: 0, width: size / 2, height: size }]}>
        <Animated.View
          style={[halfRing, { left: 0, transform: [{ rotate: leftRotation }] }]}
        />
      </View>

      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { position: "absolute", top: 0, left: 0 },
  clip: { position: "absolute", top: 0, overflow: "hidden" },
  halfRing: {
    position: "absolute",
    top: 0,
    borderColor: "transparent",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
