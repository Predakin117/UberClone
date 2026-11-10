// AI-assisted: see docs/AI_LOG.md #10, #12
// Convierte los datos del formulario en lo que se guarda en Firestore
// (documento drivers/{uid}). Son funciones puras para poder probarlas sin Firebase.
import { COMMISSION_RATE } from "../config/pricing";
import { requiresTechReview } from "../validation/documents";
import { normalizePlate } from "../validation/vehicle";

// Campos de foto de cada pestaña: antes de guardar se suben a Cloudinary
export const PHOTO_FIELDS_BY_SECTION = {
  personal: ["profilePhoto"],
  vehicle: ["vehiclePhoto"],
  documents: ["licensePhoto", "soatPhoto", "techReviewPhoto"],
};

// Una foto ya subida es una URL https; una local empieza por file:// o content://
export const isUploaded = (uri) => /^https:\/\//.test(uri);

// Fotos locales que hay que subir antes de guardar la pestaña. La de la revisión
// técnico-mecánica se omite si el vehículo todavía no la necesita.
export const photosToUpload = (section, data, today = new Date()) =>
  (PHOTO_FIELDS_BY_SECTION[section] ?? []).filter((field) => {
    if (field === "techReviewPhoto" && !requiresTechReview(data.year, today)) {
      return false;
    }
    return data[field] !== "" && !isUploaded(data[field]);
  });

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

// No se guardan cuentas bancarias ni tarjetas: los pagos los maneja Mercado Pago
export const toDocumentsDoc = (data, today = new Date()) => ({
  license: {
    number: data.licenseNumber.trim(),
    photoUrl: data.licensePhoto,
    expiry: data.licenseExpiry, // Texto AAAA-MM-DD, como la fecha de nacimiento
  },
  soat: { photoUrl: data.soatPhoto, expiry: data.soatExpiry },
  // null mientras el vehículo no necesite revisión técnico-mecánica
  techReview: requiresTechReview(data.year, today)
    ? { photoUrl: data.techReviewPhoto, expiry: data.techReviewExpiry }
    : null,
  mercadoPagoEmail: data.mercadoPagoEmail.trim().toLowerCase(),
  // Se guarda la comisión aceptada por si el porcentaje cambia más adelante
  termsAccepted: data.acceptedTerms === true,
  acceptedCommissionRate: COMMISSION_RATE,
});

export const DOC_BUILDERS = {
  personal: toPersonalDoc,
  vehicle: toVehicleDoc,
  documents: toDocumentsDoc,
};
