// AI-assisted: see docs/AI_LOG.md #53, #54, #55
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PasswordField from "../../components/PasswordField";
import NextButton from "../../components/NextButton";
import { useLanguage } from "../../contexts/LanguageContext";
import { resetPassword, signIn } from "../../services/accountService";
import { authErrorKey, validatePassword } from "../../validation/account";

// Step 2 of the login: the account exists, now the password
export default function LoginPasswordScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleChange = (text) => {
    setPassword(text);
    setError(null);
  };

  const handleSignIn = async () => {
    if (isSigningIn) return;
    const { password: passwordError } = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSigningIn(true);
    try {
      const driver = await signIn(params.email, password);
      // AI-assisted: see docs/AI_LOG.md #55
      // Correct password: before entering, a code is sent to the account's email.
      // VerifyLoginScreen decides where to go next (main menu or the tabs).
      navigation.navigate("VerifyLogin", { driver });
    } catch (signInError) {
      console.error("Error logging in:", signInError.cause ?? signInError);
      setError(authErrorKey(signInError.code));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setError(null);
    try {
      await resetPassword(params.email);
      setResetSent(true);
    } catch (resetError) {
      console.error("Error sending the reset email:", resetError.cause ?? resetError);
      setError(authErrorKey(resetError.code));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.title}>{t("password.title")}</Text>
          <Text style={styles.identifier}>{params.identifier}</Text>

          <PasswordField
            label={t("password.label")}
            value={password}
            onChangeText={handleChange}
            error={t(error)}
            autoFocus
            onSubmitEditing={handleSignIn}
          />

          <TouchableOpacity onPress={handleForgotPassword} disabled={isResetting}>
            <Text style={styles.link}>{t("password.forgot")}</Text>
          </TouchableOpacity>
          {resetSent && (
            <Text style={styles.notice}>{t("password.resetSent")}</Text>
          )}
        </View>

        <NextButton
          label={t("password.signIn")}
          onPress={handleSignIn}
          isSaving={isSigningIn}
          loadingLabel={t("password.signingIn")}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 20, justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  identifier: { fontSize: 16, color: "#555", marginBottom: 24 },
  link: { fontWeight: "bold", textDecorationLine: "underline" },
  notice: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  button: { marginBottom: 10 },
});
