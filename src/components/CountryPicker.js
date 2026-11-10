// AI-assisted: see docs/AI_LOG.md #52
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { COUNTRIES, findCountry } from "../validation/phone";

// Button with flag and dial code (🇨🇴 +57) that opens the searchable country list
export default function CountryPicker({ countryCode, onChange, hasError }) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = findCountry(countryCode);

  // Searches both languages, so "Peru" finds "Perú" without stripping accents
  const countries = useMemo(() => {
    const query = search.trim().toLowerCase().replace("+", "");
    return COUNTRIES.filter(
      (country) =>
        query === "" ||
        country.name.es.toLowerCase().includes(query) ||
        country.name.en.toLowerCase().includes(query) ||
        country.dialCode.includes(query),
    ).sort((a, b) => a.name[language].localeCompare(b.name[language], language));
  }, [search, language]);

  const close = () => {
    setIsOpen(false);
    setSearch("");
  };

  const handleSelect = (code) => {
    onChange(code);
    close();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, hasError && styles.buttonError]}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t("login.country")}: ${selected?.name[language]}`}
      >
        <Text style={styles.buttonText}>
          {selected ? `${selected.flag} ${selected.dialCode}` : "🌐"}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          {/* This Pressable keeps a tap inside the list from closing the modal */}
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("login.country")}</Text>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder={t("login.searchCountry")}
              autoCorrect={false}
            />
            <FlatList
              data={countries}
              keyExtractor={(country) => country.code}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>{t("login.noCountries")}</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item.code)}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.optionName,
                      item.code === countryCode && styles.optionSelected,
                    ]}
                  >
                    {item.name[language]}
                  </Text>
                  <Text style={styles.dialCode}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 10,
  },
  buttonError: { borderColor: "red" },
  buttonText: { fontSize: 16 },
  arrow: { marginLeft: 6, color: "#555" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  flag: { fontSize: 22, marginRight: 12 },
  optionName: { flex: 1, fontSize: 16 },
  optionSelected: { fontWeight: "bold" },
  dialCode: { fontSize: 16, color: "#555" },
  empty: { color: "#888", paddingVertical: 12 },
});
