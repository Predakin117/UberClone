// AI-assisted: see docs/AI_LOG.md #10
// Sube una foto a Cloudinary con un upload preset sin firma (no usa llaves secretas)
// y devuelve la URL pública. La carpeta de destino la define el preset.
import { File } from "expo-file-system";
import { env } from "../config/env";

export const isCloudinaryConfigured = Boolean(
  env.cloudinaryCloudName && env.cloudinaryUploadPreset,
);

export const uploadImage = async (uri) => {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary no está configurado en el .env");
  }

  // En Expo 58 el fetch global es el de Expo, que no acepta la forma clásica de
  // React Native { uri, type, name } ("Unsupported FormDataPart implementation").
  // Sí acepta un File de expo-file-system: lee sus bytes, su nombre y su tipo.
  const photo = new File(uri);
  const form = new FormData();
  form.append("file", photo);
  form.append("upload_preset", env.cloudinaryUploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message ?? "No se pudo subir la foto");
  }
  return result.secure_url;
};
