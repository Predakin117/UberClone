// AI-assisted: see docs/AI_LOG.md #60
// "Swipe to start / end the trip" button, like Uber: the driver drags the
// white circle to the right end to confirm, so a tap by accident does
// nothing. Released before the end, it slides back. Screen readers get a
// regular button instead ("activate" action), because they can't drag.
// Built with PanResponder and Animated from React Native (no new library).
// A pill as wide as the sheet; a lighter trail follows the circle while it
// moves, and the label is centered in the space right of the circle.
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";
import { colors, radius } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";

const THUMB_SIZE = 56;
const PADDING = 5;
const HEIGHT = THUMB_SIZE + PADDING * 2;
// Share of the track the circle must reach to confirm
const CONFIRM_AT = 0.85;

export default function SwipeButton({
  label,
  onComplete,
  color = colors.black,
  disabled = false,
  isLoading = false,
}) {
  const { t } = useLanguage();
  const [trackWidth, setTrackWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));
  const maxOffset = Math.max(trackWidth - THUMB_SIZE - PADDING * 2, 0);
  const isLocked = disabled || isLoading;

  const slideBack = useCallback(
    () =>
      Animated.spring(offset, {
        toValue: 0,
        bounciness: 6,
        useNativeDriver: false,
      }).start(),
    [offset],
  );

  // The drag handlers. They only change with the size of the track, the
  // locked state or the action, which don't change while dragging.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isLocked,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isLocked && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        // The map or a scroll can't take the gesture halfway
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) =>
          offset.setValue(Math.min(Math.max(gesture.dx, 0), maxOffset)),
        onPanResponderRelease: (_, gesture) => {
          if (maxOffset > 0 && gesture.dx >= maxOffset * CONFIRM_AT) {
            Animated.timing(offset, {
              toValue: maxOffset,
              duration: 120,
              useNativeDriver: false,
            }).start(() => onComplete());
          } else {
            slideBack();
          }
        },
        onPanResponderTerminate: slideBack,
      }),
    [isLocked, maxOffset, offset, onComplete, slideBack],
  );

  // Back to the start when the step changes or a failed request finishes
  useEffect(() => {
    if (!isLoading) slideBack();
  }, [isLoading, label, slideBack]);

  // The label fades while the circle covers it
  const labelOpacity = offset.interpolate({
    inputRange: [0, Math.max(maxOffset * 0.6, 1)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  // The trail behind the circle grows with it
  const trailWidth = Animated.add(offset, THUMB_SIZE);

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: color },
        disabled && styles.disabled,
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t("swipe.hint")}
      accessibilityState={{ disabled: isLocked, busy: isLoading }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate" && !isLocked) {
          onComplete();
        }
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {/* Centered with a View, so the text sits in the middle on Android too */}
          <View style={styles.labelBox} pointerEvents="none">
            <Animated.Text
              style={[styles.label, { opacity: labelOpacity }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {label}
            </Animated.Text>
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.trail, { width: trailWidth }]}
          />
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX: offset }] }]}
            {...panResponder.panHandlers}
          >
            <Ionicons name="chevron-forward" size={26} color={color} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    borderRadius: radius.pill,
    padding: PADDING,
    justifyContent: "center",
    overflow: "hidden",
  },
  disabled: { opacity: 0.5 },
  labelBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingLeft: THUMB_SIZE + PADDING * 2,
    paddingRight: PADDING * 4,
  },
  label: {
    textAlign: "center",
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  trail: {
    position: "absolute",
    left: PADDING,
    top: PADDING,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.swipeTrail,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
