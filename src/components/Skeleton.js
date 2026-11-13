// AI-assisted: see docs/AI_LOG.md #61
// Gray blocks in the shape of the screen while it loads, like Uber, instead
// of a spinner. Skeleton fades its children in and out; SkeletonBox is one
// gray block. label is read by the screen reader ("Loading…").
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors, radius } from "../config/theme";

export const SkeletonBox = ({ width = "100%", height = 16, round, style }) => (
  <View
    style={[
      styles.box,
      { width, height, borderRadius: round ? height / 2 : radius.sm },
      style,
    ]}
  />
);

export default function Skeleton({ label, style, children }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const fade = (toValue) =>
      Animated.timing(opacity, {
        toValue,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([fade(0.45), fade(1)]));
    loop.start();
    // Cleanup: stop the animation when the content arrives
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[style, { opacity }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfacePressed },
});
