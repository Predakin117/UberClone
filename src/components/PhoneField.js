// AI-assisted: see docs/AI_LOG.md #53
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { findCountry } from "../validation/phone";
import CountryPicker from "./CountryPicker";
import { formStyles } from "./formStyles";

// Country picker + mobile number. error and countryError are already translated.
export default function PhoneField({
  countryCode,
  onCountryChange,
  phone,
  onPhoneChange,
  error,
  countryError,
  autoFocus,
}) {
  const { t } = useLanguage();
  const country = findCountry(countryCode);

  const digitsHint =
    country.minDigits === country.maxDigits
      ? t("login.digitsExact").replace("{count}", country.minDigits)
      : t("login.digitsRange")
          .replace("{min}", country.minDigits)
          .replace("{max}", country.maxDigits);

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{t("login.phone")}</Text>
      <View style={styles.row}>
        <CountryPicker
          countryCode={countryCode}
          onChange={onCountryChange}
          hasError={Boolean(countryError)}
        />
        <TextInput
          style={[formStyles.input, styles.input, error && formStyles.inputError]}
          value={phone}
          onChangeText={onPhoneChange}
          placeholder={t("login.phonePlaceholder")}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus={autoFocus}
          // Room for the spaces and hyphens the driver may type
          maxLength={country.maxDigits + 4}
          accessibilityLabel={t("login.phone")}
        />
      </View>
      {error || countryError ? (
        <Text style={formStyles.errorText}>{error || countryError}</Text>
      ) : (
        <Text style={styles.hint}>{digitsHint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, fontSize: 16 },
  hint: { color: "#888", fontSize: 12, marginTop: 5 },
});
