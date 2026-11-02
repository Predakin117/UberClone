// AI-assisted: see docs/AI_LOG.md #6
import { Text, TextInput, View } from "react-native";
import { formStyles } from "./formStyles";

export default function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  ...inputProps
}) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[formStyles.input, error && formStyles.inputError]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        {...inputProps}
      />
      {error && <Text style={formStyles.errorText}>{error}</Text>}
    </View>
  );
}
