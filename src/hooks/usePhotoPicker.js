// AI-assisted: see docs/AI_LOG.md #58
// Asks for the permission and opens the camera or the gallery. Shared by the
// registration photo fields and the profile selfie. errorKey is a key of
// src/i18n/strings.js, so the message follows the language.
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

const SOURCES = {
  camera: [
    ImagePicker.requestCameraPermissionsAsync,
    ImagePicker.launchCameraAsync,
  ],
  library: [
    ImagePicker.requestMediaLibraryPermissionsAsync,
    ImagePicker.launchImageLibraryAsync,
  ],
};

// onPicked(uri) receives the photo. source is "camera" or "library"; options
// go to expo-image-picker (for example the front camera for the selfie).
export function usePhotoPicker(onPicked) {
  const [errorKey, setErrorKey] = useState(null);

  const pick = useCallback(
    async (source, options = {}) => {
      setErrorKey(null);
      const [requestPermission, launchPicker] = SOURCES[source];
      try {
        const { granted } = await requestPermission();
        if (!granted) {
          setErrorKey("photo.permissionDenied");
          return;
        }

        const result = await launchPicker({
          mediaTypes: "images",
          quality: 0.7,
          ...options,
        });
        if (!result.canceled) onPicked(result.assets[0].uri);
      } catch (pickError) {
        console.error("Error picking the photo:", pickError);
        setErrorKey("photo.pickError");
      }
    },
    [onPicked],
  );

  return { pick, errorKey };
}
