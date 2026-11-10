// AI-assisted: see docs/AI_LOG.md #53
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

// Black full-width button. While loading it shows a spinner and ignores taps.
export default function PrimaryButton({ title, onPress, loading = false, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.loading, style]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  loading: { opacity: 0.7 },
  text: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
