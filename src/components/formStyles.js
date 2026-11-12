// AI-assisted: see docs/AI_LOG.md #7, #54
import { StyleSheet } from "react-native";
import {
  colors,
  CONTROL_HEIGHT,
  radius,
  spacing,
  typography,
} from "../config/theme";

// Styles shared by the registration fields: light gray inputs without a
// border, a black border while focused and a red one when there's an error
export const formStyles = StyleSheet.create({
  field: { marginBottom: spacing.lg + 4 },
  label: { ...typography.label, marginBottom: spacing.sm },
  input: {
    minHeight: CONTROL_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
    justifyContent: "center",
  },
  inputFocused: { borderColor: colors.black, backgroundColor: colors.white },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 13, marginTop: 6 },
  // Data that comes from the account and can't be edited
  inputLocked: {
    backgroundColor: colors.surfacePressed,
    color: colors.textSecondary,
  },
  // Character limit reached: a warning, not an error
  warningText: { color: colors.warning, fontSize: 13, marginTop: 6 },
  hintText: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
  // Text inside the touchable fields (lists and dates)
  valueText: { fontSize: 16, color: colors.textPrimary, flex: 1 },
  placeholderText: { fontSize: 16, color: colors.placeholder, flex: 1 },
  // Lists and dates: the value on the left and the arrow on the right
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
