// Round white button over the map that centers it again on the driver, like
// the "locate" button of Uber. The screen decides where to put it and what
// centering means (the driver's position, or the whole route).
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";

export const RECENTER_SIZE = 48;

export default function RecenterButton({ onPress, style }) {
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t("map.recenter")}
    >
      <Ionicons name="locate" size={24} color={colors.black} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: RECENTER_SIZE,
    height: RECENTER_SIZE,
    borderRadius: RECENTER_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
