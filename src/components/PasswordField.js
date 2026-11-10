// AI-assisted: see docs/AI_LOG.md #53, #54
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { MAX_PASSWORD_LENGTH } from "../validation/account";
import FieldMessage from "./FieldMessage";
import { formStyles } from "./formStyles";

// Password input with a Show/Hide button. error is already translated.
export default function PasswordField({
  label,
  value,
  onChangeText,
  error,
  hint,
  autoFocus,
  isNewPassword = false,
  onSubmitEditing,
}) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <View style={[formStyles.input, styles.box, error && formStyles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          maxLength={MAX_PASSWORD_LENGTH}
          // Lets the phone suggest a strong password or fill in a saved one
          textContentType={isNewPassword ? "newPassword" : "password"}
          autoComplete={isNewPassword ? "new-password" : "current-password"}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label}
        />
        <TouchableOpacity
          onPress={() => setIsVisible((visible) => !visible)}
          accessibilityRole="button"
        >
          <Text style={styles.toggle}>
            {isVisible ? t("password.hide") : t("password.show")}
          </Text>
        </TouchableOpacity>
      </View>
      <FieldMessage
        error={error}
        hint={hint}
        length={value.length}
        maxLength={MAX_PASSWORD_LENGTH}
        showLimit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", paddingVertical: 0 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  toggle: { fontWeight: "bold", marginLeft: 10 },
});
