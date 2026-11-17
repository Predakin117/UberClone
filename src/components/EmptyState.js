// AI-assisted: see docs/AI_LOG.md #64
// Empty screen with a simple drawing instead of a blank list (section 6): a
// big gray circle with an icon and a small black badge with a second icon,
// a title and a line of text. Drawn with icons, no images.
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../config/theme";

const CIRCLE_SIZE = 112;
const BADGE_SIZE = 40;

export default function EmptyState({ icon, badge, title, text, isError }) {
  return (
    <View style={styles.container}>
      <View style={styles.drawing}>
        <View style={styles.circle}>
          <Ionicons name={icon} size={52} color={colors.black} />
        </View>
        {badge && (
          <View style={[styles.badge, isError && styles.badgeError]}>
            <Ionicons name={badge} size={20} color={colors.white} />
          </View>
        )}
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
      {text && (
        <Text style={[styles.text, isError && styles.errorText]}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  drawing: { marginBottom: spacing.md },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -4,
    bottom: 4,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.background,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeError: { backgroundColor: colors.error },
  title: { ...typography.section, fontSize: 18, textAlign: "center" },
  text: { ...typography.subtitle, fontSize: 15, textAlign: "center" },
  errorText: { color: colors.error },
});
