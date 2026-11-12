// AI-assisted: see docs/AI_LOG.md #7, #54, #56
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { colors } from "../config/theme";
import FieldMessage from "./FieldMessage";
import { formStyles } from "./formStyles";

// showLimit: warns when the text gets close to maxLength (for free text such
// as names and emails; fields with a fixed length like the plate don't need it).
// editable={false} shows the field grayed out, for data that can't be changed.
export default function FormField({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  hint,
  showLimit = false,
  ...inputProps
}) {
  const isLocked = inputProps.editable === false;
  // Only for the look: the field gets a black border while typing
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[
          formStyles.input,
          isFocused && formStyles.inputFocused,
          isLocked && formStyles.inputLocked,
          error && formStyles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.black}
        accessibilityLabel={label}
        accessibilityState={{ disabled: isLocked }}
        {...inputProps}
      />
      <FieldMessage
        error={error}
        hint={hint}
        length={value?.length ?? 0}
        maxLength={inputProps.maxLength}
        showLimit={showLimit && !isLocked}
      />
    </View>
  );
}
