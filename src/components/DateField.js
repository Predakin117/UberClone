// AI-assisted: see docs/AI_LOG.md #9, #12, #56
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
import { colors, radius, spacing } from "../config/theme";
import { useLanguage } from "../contexts/LanguageContext";
import Chevron from "./Chevron";
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
        style={[
          formStyles.input,
          formStyles.inputRow,
          isIOSPickerOpen && formStyles.inputFocused,
          error && formStyles.inputError,
        ]}
        onPress={open}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          style={
            value === "" ? formStyles.placeholderText : formStyles.valueText
          }
        >
          {value === ""
            ? (placeholder ?? t("date.placeholder"))
            : formatDisplayDate(value)}
        </Text>
        <Chevron />
      </TouchableOpacity>

      {isIOSPickerOpen && (
        <View style={styles.iosPicker}>
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
  iosPicker: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  doneButton: { alignSelf: "flex-end", padding: spacing.md },
  doneText: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
});
