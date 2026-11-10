// AI-assisted: see docs/AI_LOG.md #52, #53
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "../../components/FormField";
import PhoneField from "../../components/PhoneField";
import PrimaryButton from "../../components/PrimaryButton";
import { useLanguage } from "../../contexts/LanguageContext";
import { findAccount } from "../../services/accountService";
import {
  authErrorKey,
  LOGIN_METHODS,
  validateLoginIdentifier,
} from "../../validation/account";
import {
  DEFAULT_COUNTRY_CODE,
  toInternationalPhone,
} from "../../validation/phone";

// Step 1 of the login: phone or email. If the account exists it asks for the
// password (LoginPasswordScreen); if not, it offers to create one.
export default function LoginScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [method, setMethod] = useState("phone");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // Errors show up after the first attempt to continue
  const [showErrors, setShowErrors] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  // "notFound" or a translation key of a failed lookup
  const [lookupResult, setLookupResult] = useState(null);

  const errors = useMemo(
    () => validateLoginIdentifier({ method, email, countryCode, phone }),
    [method, email, countryCode, phone],
  );
  const fieldError = (field) => (showErrors ? t(errors[field]) : null);

  // Any change makes the previous "not found" message out of date
  const update = (setter) => (value) => {
    setter(value);
    setLookupResult(null);
  };

  const changeMethod = (next) => {
    setMethod(next);
    setShowErrors(false);
    setLookupResult(null);
  };

  const goToCreateAccount = () =>
    navigation.navigate("CreateAccount", {
      // Fills in what the driver already typed
      email: method === "email" ? email : "",
      countryCode,
      phone: method === "phone" ? phone : "",
    });

  const handleContinue = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0 || isChecking) return;

    const identifier =
      method === "email" ? email : toInternationalPhone(countryCode, phone);

    setIsChecking(true);
    setLookupResult(null);
    try {
      const account = await findAccount(method, identifier);
      if (!account) {
        setLookupResult("notFound");
        return;
      }
      navigation.navigate("LoginPassword", {
        email: account.email,
        // What the driver typed, shown on the password screen
        identifier: method === "email" ? email.trim() : identifier,
      });
    } catch (error) {
      console.error("Error looking up the account:", error.cause ?? error);
      setLookupResult(authErrorKey(error.code));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.title}>{t("login.title")}</Text>
            <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

            {/* Phone | Email switch */}
            <View style={styles.segment} accessibilityRole="tablist">
              {LOGIN_METHODS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.segmentOption,
                    method === option && styles.segmentSelected,
                  ]}
                  onPress={() => changeMethod(option)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: method === option }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      method === option && styles.segmentTextSelected,
                    ]}
                  >
                    {option === "phone"
                      ? t("login.methodPhone")
                      : t("login.methodEmail")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {method === "phone" ? (
              <PhoneField
                countryCode={countryCode}
                onCountryChange={update(setCountryCode)}
                phone={phone}
                onPhoneChange={update(setPhone)}
                error={fieldError("phone")}
                countryError={fieldError("countryCode")}
              />
            ) : (
              <FormField
                label={t("login.email")}
                value={email}
                onChangeText={update(setEmail)}
                error={fieldError("email")}
                placeholder={t("login.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
            )}

            {lookupResult === "notFound" && (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  {method === "phone"
                    ? t("login.notFoundPhone")
                    : t("login.notFoundEmail")}
                </Text>
                <TouchableOpacity onPress={goToCreateAccount}>
                  <Text style={styles.link}>{t("login.createAccount")}</Text>
                </TouchableOpacity>
              </View>
            )}
            {lookupResult && lookupResult !== "notFound" && (
              <Text style={styles.errorText}>{t(lookupResult)}</Text>
            )}
          </View>

          <View>
            <PrimaryButton
              title={t("login.continue")}
              onPress={handleContinue}
              loading={isChecking}
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("login.noAccount")} </Text>
              <TouchableOpacity onPress={goToCreateAccount}>
                <Text style={styles.link}>{t("login.createAccount")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 20, justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 24 },
  segment: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 21,
    alignItems: "center",
  },
  segmentSelected: { backgroundColor: "#000" },
  segmentText: { fontSize: 15, fontWeight: "bold", color: "#555" },
  segmentTextSelected: { color: "#fff" },
  notice: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    marginTop: 5,
  },
  noticeText: { fontSize: 15, marginBottom: 8 },
  link: { fontWeight: "bold", textDecorationLine: "underline" },
  errorText: { color: "red", fontSize: 14, marginTop: 5 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  footerText: { color: "#555" },
});
