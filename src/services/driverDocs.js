// AI-assisted: see docs/AI_LOG.md #10
// Convierte los datos del formulario en lo que se guarda en Firestore
// (documento drivers/{uid}). Son funciones puras para poder probarlas sin Firebase.
import { normalizePlate } from "../validation/vehicle";

// Campo de foto de cada pestaña: antes de guardar se sube a Cloudinary
export const PHOTO_FIELD_BY_SECTION = {
  personal: "profilePhoto",
  vehicle: "vehiclePhoto",
};

export const toPersonalDoc = (data) => ({
  profilePhotoUrl: data.profilePhoto,
  name: data.name.trim().replace(/\s+/g, " "),
  documentId: data.documentId.trim(),
  phone: data.phone.trim(),
  birthDate: data.birthDate, // Texto AAAA-MM-DD, sin problemas de zona horaria
  gender: data.gender,
  email: data.email.trim().toLowerCase(),
  language: data.language,
});

export const toVehicleDoc = (data) => ({
  category: data.category,
  plate: normalizePlate(data.plate),
  make: data.vehicleMake.trim(),
  model: data.vehicleModel.trim(),
  year: Number(data.year),
  color: data.color,
  capacity: Number(data.capacity),
  photoUrl: data.vehiclePhoto,
});

export const toDocumentsDoc = (data) => ({
  licenseNumber: data.licenseNumber.trim(),
});

export const DOC_BUILDERS = {
  personal: toPersonalDoc,
  vehicle: toVehicleDoc,
  documents: toDocumentsDoc,
};

// Una foto ya subida es una URL https; una local empieza por file:// o content://
export const isUploaded = (uri) => /^https:\/\//.test(uri);
