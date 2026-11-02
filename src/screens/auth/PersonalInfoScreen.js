// AI-assisted: see docs/AI_LOG.md #3, #4, #6
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import FormField from "../../components/FormField";
import { RegistrationContext } from "../../contexts/RegistrationContext";

export default function PersonalInfoScreen() {
  const { formData, errors, handleChange, touchField } =
    useContext(RegistrationContext);

  return (
    <View style={styles.container}>
      <FormField
        label="Nombre Completo"
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
        onBlur={() => touchField("name")}
        error={errors.name}
        placeholder="Ej. Tamiro Solano"
      />

      <FormField
        label="Correo Electrónico"
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        onBlur={() => touchField("email")}
        error={errors.email}
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
});
