// Small arrow drawn with borders (no icon library): "down" on the lists,
// "right" where a field opens something else
import { StyleSheet, View } from "react-native";
import { colors } from "../config/theme";

const ROTATION = { down: "45deg", right: "-45deg" };

export default function Chevron({ direction = "down", color = colors.black }) {
  return (
    <View
      style={[
        styles.chevron,
        { borderColor: color, transform: [{ rotate: ROTATION[direction] }] },
        direction === "down" && styles.down,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chevron: {
    width: 9,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  // Rotated, the arrow looks low: it goes up a little to look centered
  down: { marginTop: -4 },
});
