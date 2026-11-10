// AI-assisted: see docs/AI_LOG.md #52
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CountryPicker from "../../components/CountryPicker";
import { formStyles } from "../../components/formStyles";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  DEFAULT_COUNTRY_CODE,
  findCountry,
  toInternationalPhone,
  validateLoginPhone,
} from "../../validation/phone";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState("");
  // Errors show up after the first attempt to continue
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(
    () => validateLoginPhone({ countryCode, phone }),
    [countryCode, phone],
  );
  const country = findCountry(countryCode);
  const phoneError = showErrors ? t(errors.phone) : null;

  const digitsHint =
    country.minDigits === country.maxDigits
      ? t("login.digitsExact").replace("{count}", country.minDigits)
      : t("login.digitsRange")
          .replace("{min}", country.minDigits)
          .replace("{max}", country.maxDigits);

  const handleContinue = () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;

    // There is no SMS verification yet: for now it opens the registration with
    // the number in international format, ready for the next step
    navigation.navigate("Register", {
      phoneNumber: toInternationalPhone(countryCode, phone),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View>
          <Text style={styles.title}>{t("login.title")}</Text>
          <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

          <Text style={formStyles.label}>{t("login.phone")}</Text>
          <View style={styles.phoneRow}>
            <CountryPicker
              countryCode={countryCode}
              onChange={setCountryCode}
              hasError={showErrors && Boolean(errors.countryCode)}
            />
            <TextInput
              style={[
                formStyles.input,
                styles.phoneInput,
                phoneError && formStyles.inputError,
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("login.phonePlaceholder")}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={country.maxDigits + 4}
              accessibilityLabel={t("login.phone")}
            />
          </View>
          {phoneError ? (
            <Text style={formStyles.errorText}>{phoneError}</Text>
          ) : (
            <Text style={styles.hint}>{digitsHint}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t("login.continue")}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 20, justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 30 },
  phoneRow: { flexDirection: "row", alignItems: "center" },
  phoneInput: { flex: 1, fontSize: 16 },
  hint: { color: "#888", fontSize: 12, marginTop: 5 },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
