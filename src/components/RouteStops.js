// AI-assisted: see docs/AI_LOG.md #60
// Origin and destination like Uber: a dot for the pickup, a square for the
// drop-off and a line between them, each with its address.
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../config/theme";

export default function RouteStops({
  origin,
  destination,
  numberOfLines = 1,
  originLabel,
  destinationLabel,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.markers}>
        <View style={styles.dot} />
        <View style={styles.line} />
        <View style={styles.square} />
      </View>
      <View style={styles.addresses}>
        <View>
          {originLabel && <Text style={styles.label}>{originLabel}</Text>}
          <Text style={styles.address} numberOfLines={numberOfLines}>
            {origin}
          </Text>
        </View>
        <View>
          {destinationLabel && (
            <Text style={styles.label}>{destinationLabel}</Text>
          )}
          <Text style={styles.address} numberOfLines={numberOfLines}>
            {destination}
          </Text>
        </View>
      </View>
    </View>
  );
}

const MARKER = 9;

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: spacing.md },
  markers: { alignItems: "center", paddingVertical: 6 },
  dot: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: colors.black,
  },
  line: {
    flex: 1,
    width: 2,
    minHeight: spacing.md,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  square: { width: MARKER, height: MARKER, backgroundColor: colors.black },
  addresses: { flex: 1, justifyContent: "space-between", gap: spacing.md },
  label: typography.caption,
  address: { ...typography.body, fontSize: 15 },
});
