// AI-assisted: see docs/AI_LOG.md #7, #9
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { formStyles } from "./formStyles";

export default function PhotoField({ label, uri, onChange, error }) {
  const { t } = useLanguage();
  // Guarda la clave del error para que cambie si se cambia el idioma
  const [pickerError, setPickerError] = useState(null);

  const pickFrom = async (requestPermission, launchPicker) => {
    setPickerError(null);
    try {
      const { granted } = await requestPermission();
      if (!granted) {
        setPickerError("photo.permissionDenied");
        return;
      }

      const result = await launchPicker({ mediaTypes: "images", quality: 0.7 });
      if (!result.canceled) {
        onChange(result.assets[0].uri);
      }
    } catch (pickError) {
      console.error("Error seleccionando la foto:", pickError);
      setPickerError("photo.pickError");
    }
  };

  const message = t(pickerError) || error;

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
          <Text>{t("photo.takePhoto")}</Text>
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
          <Text>{t("photo.chooseFromGallery")}</Text>
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
