// AI-assisted: see docs/AI_LOG.md #58
// Round profile photo. Without a photo it draws a gray silhouette (head and
// shoulders) with Views, so the app doesn't need an icon library.
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { colors } from "../config/theme";

export default function Avatar({ uri, size = 56, style, accessibilityLabel }) {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[circle, style]}
        contentFit="cover"
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  const head = size * 0.36;
  const shoulders = size * 0.66;

  return (
    <View
      style={[styles.empty, circle, style]}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.shape,
          {
            width: head,
            height: head,
            borderRadius: head / 2,
            marginTop: size * 0.2,
          },
        ]}
      />
      <View
        style={[
          styles.shape,
          {
            width: shoulders,
            height: size * 0.4,
            borderTopLeftRadius: shoulders / 2,
            borderTopRightRadius: shoulders / 2,
            marginTop: size * 0.05,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The circle cuts the shoulders at the bottom
  empty: {
    backgroundColor: colors.surfacePressed,
    alignItems: "center",
    overflow: "hidden",
  },
  shape: { backgroundColor: colors.disabledText },
});
