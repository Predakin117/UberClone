// AI-assisted: see docs/AI_LOG.md #7, #9
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { formStyles } from "./formStyles";

export default function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  placeholder,
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[formStyles.input, error && formStyles.inputError]}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={!selected && styles.placeholder}>
          {selected ? selected.label : (placeholder ?? t("select.placeholder"))}
        </Text>
      </TouchableOpacity>
      {error && <Text style={formStyles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          {/* Este Pressable evita que un toque dentro de la lista cierre el modal */}
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(option) => option.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={item.value === value && styles.optionSelected}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { color: "#888" },
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
    maxHeight: "70%",
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  option: { paddingVertical: 14 },
  optionSelected: { fontWeight: "bold" },
});
