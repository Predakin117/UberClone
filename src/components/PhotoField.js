// AI-assisted: see docs/AI_LOG.md #6
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formStyles } from "./formStyles";

export default function PhotoField({ label, uri, onChange, error }) {
  const [pickerError, setPickerError] = useState(null);

  const pickFrom = async (requestPermission, launchPicker) => {
    setPickerError(null);
    try {
      const { granted } = await requestPermission();
      if (!granted) {
        setPickerError("Debes conceder el permiso para agregar la foto.");
        return;
      }

      const result = await launchPicker({ mediaTypes: "images", quality: 0.7 });
      if (!result.canceled) {
        onChange(result.assets[0].uri);
      }
    } catch (pickError) {
      console.error("Error seleccionando la foto:", pickError);
      setPickerError("No se pudo obtener la foto. Inténtalo de nuevo.");
    }
  };

  const message = pickerError || error;

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      {uri !== "" && (
        <Image source={{ uri }} style={styles.preview} contentFit="cover" />
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, message && formStyles.inputError]}
          onPress={() =>
            pickFrom(
              ImagePicker.requestCameraPermissionsAsync,
              ImagePicker.launchCameraAsync,
            )
          }
        >
          <Text>Tomar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, message && formStyles.inputError]}
          onPress={() =>
            pickFrom(
              ImagePicker.requestMediaLibraryPermissionsAsync,
              ImagePicker.launchImageLibraryAsync,
            )
          }
        >
          <Text>Elegir de galería</Text>
        </TouchableOpacity>
      </View>
      {message && <Text style={formStyles.errorText}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonRow: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
});
