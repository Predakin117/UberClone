// AI-assisted: see docs/AI_LOG.md #52, #58
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  CONTROL_HEIGHT,
  radius,
  spacing,
  typography,
} from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import Chevron from "./Chevron";
import { COUNTRIES, findCountry } from "../validation/phone";

// Button with flag and dial code (🇨🇴 +57) that opens the searchable country list
export default function CountryPicker({ countryCode, onChange, hasError }) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

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
        <Chevron />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          {/* This Pressable keeps a tap inside the list from closing the modal */}
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{t("login.country")}</Text>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder={t("login.searchCountry")}
              placeholderTextColor={colors.placeholder}
              autoCorrect={false}
            />
            <FlatList
              data={countries}
              keyExtractor={(country) => country.code}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
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

// AI-assisted: see docs/AI_LOG.md #58
// Same look as the other inputs, and the list opens from the bottom like
// SelectField
const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: CONTROL_HEIGHT,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  buttonError: { borderColor: colors.error },
  buttonText: { fontSize: 16, color: colors.textPrimary },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xl - 4,
    paddingTop: spacing.sm,
    height: "75%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetTitle: { ...typography.section, marginBottom: spacing.md },
  search: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  option: { flexDirection: "row", alignItems: "center", minHeight: 56 },
  flag: { fontSize: 22, marginRight: spacing.md },
  optionName: { flex: 1, fontSize: 16, color: colors.textPrimary },
  optionSelected: { fontWeight: "700" },
  dialCode: { fontSize: 16, color: colors.textSecondary },
  empty: { ...typography.caption, paddingVertical: spacing.md },
});
