// AI-assisted: see docs/AI_LOG.md #53, #54, #55, #58
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NextButton from "../../components/NextButton";
import PasswordField from "../../components/PasswordField";
import StepLayout from "../../components/StepLayout";
import { colors, radius, spacing, typography } from "../../config/theme";
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

  // AI-assisted: see docs/AI_LOG.md #58
  // Only the look changes: the account as a chip that goes back to change it,
  // and the button fixed at the bottom (StepLayout)
  return (
    <StepLayout
      title={t("password.title")}
      footer={
        <NextButton
          label={t("password.signIn")}
          onPress={handleSignIn}
          isSaving={isSigningIn}
          loadingLabel={t("password.signingIn")}
          style={styles.button}
        />
      }
    >
      <View style={styles.account}>
        <Text style={styles.identifier} numberOfLines={1}>
          {params.identifier}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.link}>{t("password.change")}</Text>
        </TouchableOpacity>
      </View>

      <PasswordField
        label={t("password.label")}
        value={password}
        onChangeText={handleChange}
        error={t(error)}
        autoFocus
        onSubmitEditing={handleSignIn}
      />

      <TouchableOpacity
        onPress={handleForgotPassword}
        disabled={isResetting}
        accessibilityRole="button"
      >
        <Text style={[styles.link, isResetting && styles.linkDisabled]}>
          {t("password.forgot")}
        </Text>
      </TouchableOpacity>
      {resetSent && (
        <Text style={styles.notice}>{t("password.resetSent")}</Text>
      )}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.xl,
  },
  identifier: { ...typography.body, flex: 1, fontWeight: "600" },
  link: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    textDecorationLine: "underline",
  },
  linkDisabled: { color: colors.disabledText },
  notice: {
    ...typography.body,
    lineHeight: 22,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    borderRadius: radius.sm,
    padding: spacing.lg,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  button: { marginTop: 0 },
});
