// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #10
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import FormField from "../../components/FormField";
import NextButton from "../../components/NextButton";
import { useLanguage } from "../../contexts/LanguageContext";
import { RegistrationContext } from "../../contexts/RegistrationContext";

export default function DocumentsScreen() {
  const { t } = useLanguage();
  const {
    formData,
    errors,
    handleChange,
    touchField,
    canSubmit,
    submitRegistration,
    isSaving,
    saveError,
  } = useContext(RegistrationContext);

  return (
    <View style={styles.container}>
      <FormField
        label="Número de Licencia"
        value={formData.licenseNumber}
        onChangeText={(text) => handleChange("licenseNumber", text)}
        onBlur={() => touchField("licenseNumber")}
        error={errors.licenseNumber}
        placeholder="Ej. 123456789"
      />
      {/* Espaciador */}
      <View style={{ flex: 1 }} />
      {/* Botón condicionado a canSubmit. Al enviar se guardan las 3 pestañas,
          así que aquí se muestra el error de cualquiera de ellas */}
      <NextButton
        label={canSubmit ? "Enviar Registro" : "Completa todas las pestañas"}
        onPress={submitRegistration}
        disabled={!canSubmit}
        isSaving={isSaving}
        error={saveError && t(saveError.code)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
});
