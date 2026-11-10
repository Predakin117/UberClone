// AI-assisted: see docs/AI_LOG.md #53, #54
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import FormField from "../../components/FormField";
import PasswordField from "../../components/PasswordField";
import PhoneField from "../../components/PhoneField";
import NextButton from "../../components/NextButton";
import { useLanguage } from "../../contexts/LanguageContext";
import { createAccount } from "../../services/accountService";
import { authErrorKey, validateNewAccount } from "../../validation/account";
import { MAX_EMAIL_LENGTH } from "../../validation/personalInfo";
import { DEFAULT_COUNTRY_CODE } from "../../validation/phone";

// Creates the login account (email, phone and password) and then opens the
// registration tabs to fill in the driver's data
export default function CreateAccountScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { t } = useLanguage();

  // Starts with what the driver typed on the login screen
  const [form, setForm] = useState({
    email: params.email ?? "",
    countryCode: params.countryCode ?? DEFAULT_COUNTRY_CODE,
    phone: params.phone ?? "",
    password: "",
    confirmPassword: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const errors = useMemo(() => validateNewAccount(form), [form]);
  const fieldError = (field) => (showErrors ? t(errors[field]) : null);

  const setField = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };

  const handleCreate = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0 || isCreating) return;

    setIsCreating(true);
    setSubmitError(null);
    try {
      const account = await createAccount(form);
      // The account exists now: the next step is the driver registration, with
      // the email and phone already filled in. replace() so the back button
      // doesn't return to this form.
      navigation.replace("Register", {
        account: { email: account.email, phone: account.phone },
      });
    } catch (error) {
      console.error("Error creating the account:", error.cause ?? error);
      setSubmitError(authErrorKey(error.code));
      setIsCreating(false);
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
        <Text style={styles.title}>{t("signup.title")}</Text>
        <Text style={styles.subtitle}>{t("signup.subtitle")}</Text>

        <FormField
          label={t("login.email")}
          value={form.email}
          onChangeText={setField("email")}
          error={fieldError("email")}
          placeholder={t("login.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
          maxLength={MAX_EMAIL_LENGTH}
          showLimit
        />

        <PhoneField
          countryCode={form.countryCode}
          onCountryChange={setField("countryCode")}
          phone={form.phone}
          onPhoneChange={setField("phone")}
          error={fieldError("phone")}
          countryError={fieldError("countryCode")}
        />

        <PasswordField
          label={t("password.label")}
          value={form.password}
          onChangeText={setField("password")}
          error={fieldError("password")}
          hint={t("signup.passwordHint")}
          isNewPassword
        />

        <PasswordField
          label={t("signup.confirmPassword")}
          value={form.confirmPassword}
          onChangeText={setField("confirmPassword")}
          error={fieldError("confirmPassword")}
          isNewPassword
          onSubmitEditing={handleCreate}
        />

        {submitError && <Text style={styles.errorText}>{t(submitError)}</Text>}

        <NextButton
          label={t("signup.submit")}
          onPress={handleCreate}
          isSaving={isCreating}
          loadingLabel={t("signup.creating")}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 24 },
  errorText: { color: "red", fontSize: 14, marginBottom: 10 },
  button: { marginTop: 10, marginBottom: 20 },
});
