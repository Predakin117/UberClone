// AI-assisted: see docs/AI_LOG.md #7, #54
import { Text, TextInput, View } from "react-native";
import FieldMessage from "./FieldMessage";
import { formStyles } from "./formStyles";

// showLimit: warns when the text gets close to maxLength (for free text such
// as names and emails; fields with a fixed length like the plate don't need it).
// editable={false} shows the field grayed out, for data that can't be changed.
export default function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
  showLimit = false,
  ...inputProps
}) {
  const isLocked = inputProps.editable === false;

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[
          formStyles.input,
          isLocked && formStyles.inputLocked,
          error && formStyles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
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
