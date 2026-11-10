// AI-assisted: see docs/AI_LOG.md #9, #12
// Campo de fecha reutilizable: lo usan la fecha de nacimiento y los
// vencimientos de la pestaña 3. El valor es texto "AAAA-MM-DD" (ver validation/dates.js).
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  formatDisplayDate,
  parseISODate,
  toISODate,
} from "../validation/dates";
import { useLanguage } from "../contexts/LanguageContext";
import { formStyles } from "./formStyles";

export default function DateField({
  label,
  value,
  onChange,
  onBlur,
  error,
  minimumDate,
  maximumDate,
  defaultDate,
  placeholder,
}) {
  const { language, t } = useLanguage();
  const [isIOSPickerOpen, setIsIOSPickerOpen] = useState(false);

  // Si aún no hay fecha, el selector abre en defaultDate o en la fecha máxima permitida
  // (los vencimientos de la pestaña 3 abren en mañana y no tienen fecha máxima)
  const pickerDate =
    parseISODate(value) ?? defaultDate ?? maximumDate ?? new Date();

  const handleValueChange = (_event, date) => {
    onChange(toISODate(date));
  };

  const open = () => {
    if (Platform.OS === "android") {
      // En Android la librería recomienda la API imperativa (abre un diálogo)
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: "date",
        minimumDate,
        maximumDate,
        onValueChange: handleValueChange,
        onDismiss: onBlur,
      });
    } else {
      setIsIOSPickerOpen(true);
    }
  };

  const closeIOSPicker = () => {
    // Al confirmar sin mover la rueda se toma la fecha que se estaba mostrando
    if (value === "") onChange(toISODate(pickerDate));
    setIsIOSPickerOpen(false);
    onBlur?.();
  };

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[formStyles.input, error && formStyles.inputError]}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={value === "" && styles.placeholder}>
          {value === ""
            ? (placeholder ?? t("date.placeholder"))
            : formatDisplayDate(value)}
        </Text>
      </TouchableOpacity>

      {isIOSPickerOpen && (
        <View>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="spinner"
            locale={language === "en" ? "en-US" : "es-CO"}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onValueChange={handleValueChange}
          />
          <TouchableOpacity style={styles.doneButton} onPress={closeIOSPicker}>
            <Text style={styles.doneText}>{t("common.done")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={formStyles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { color: "#888" },
  doneButton: { alignSelf: "flex-end", padding: 10 },
  doneText: { fontSize: 16, fontWeight: "bold" },
});
