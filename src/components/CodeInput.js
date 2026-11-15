// AI-assisted: see docs/AI_LOG.md #58
// Verification code shown as one box per digit, like Uber. A single invisible
// TextInput covers the boxes: it gets the taps, the typing and the code the
// phone suggests from the email. The boxes only draw its value.
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../config/theme";
import { formStyles } from "./formStyles";

export default function CodeInput({
  label,
  value,
  onChangeText,
  length = 6,
  hasError = false,
  autoFocus,
  editable = true,
  onSubmitEditing,
}) {
  const [isFocused, setIsFocused] = useState(false);
  // The box that receives the next digit
  const current = Math.min(value.length, length - 1);

  return (
    <View style={formStyles.field}>
      {label && <Text style={formStyles.label}>{label}</Text>}
      <View style={styles.row}>
        {Array.from({ length }, (_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              isFocused && index === current && styles.boxActive,
              hasError && styles.boxError,
              !editable && styles.boxLocked,
            ]}
          >
            <Text style={styles.digit}>{value[index] ?? ""}</Text>
          </View>
        ))}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          maxLength={length}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmitEditing}
          caretHidden
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  box: {
    flex: 1,
    height: 60,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: colors.black, backgroundColor: colors.white },
  boxError: { borderColor: colors.error },
  boxLocked: { backgroundColor: colors.surfacePressed },
  digit: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
  // Invisible, on top of the boxes
  input: { ...StyleSheet.absoluteFillObject, opacity: 0, color: "transparent" },
});
