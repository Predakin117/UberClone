// AI-assisted: see docs/AI_LOG.md #7, #9
// Los errores son claves de traducción (src/i18n/strings.js); la pantalla los
// muestra en el idioma elegido.
import { getAge, parseISODate } from "./dates";

// Las etiquetas de cada género están en strings.js como "gender.<valor>"
export const GENDER_VALUES = ["female", "male", "non_binary", "not_specified"];

// El mismo selector de idioma de la app del pasajero. Cada idioma se muestra en
// su propio idioma, así se reconoce aunque la app esté en el otro.
export const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

export const PERSONAL_FIELDS = [
  "profilePhoto",
  "name",
  "documentId",
  "phone",
  "birthDate",
  "gender",
  "email",
  "language",
];

export const MAX_NAME_LENGTH = 50;
export const MIN_DRIVER_AGE = 18;

// Letras (con tildes, ü y ñ) y espacios
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const DOCUMENT_REGEX = /^\d{6,10}$/;
const PHONE_REGEX = /^\d{10}$/;

// Formato básico usuario@dominio.ext
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// today se puede inyectar para que las pruebas no dependan de la fecha real
export const validatePersonalInfo = (data, today = new Date()) => {
  const errors = {};

  if (data.profilePhoto === "") {
    errors.profilePhoto = "errors.profilePhotoRequired";
  }

  const name = data.name.trim();
  if (name === "") {
    errors.name = "errors.nameRequired";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = "errors.nameTooLong";
  } else if (!NAME_REGEX.test(name)) {
    errors.name = "errors.nameInvalid";
  }

  const documentId = data.documentId.trim();
  if (documentId === "") {
    errors.documentId = "errors.documentIdRequired";
  } else if (!DOCUMENT_REGEX.test(documentId)) {
    errors.documentId = "errors.documentIdInvalid";
  }

  const phone = data.phone.trim();
  if (phone === "") {
    errors.phone = "errors.phoneRequired";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.phone = "errors.phoneInvalid";
  }

  if (data.birthDate === "") {
    errors.birthDate = "errors.birthDateRequired";
  } else {
    const birthDate = parseISODate(data.birthDate);
    if (!birthDate) {
      errors.birthDate = "errors.birthDateInvalid";
    } else if (getAge(birthDate, today) < MIN_DRIVER_AGE) {
      errors.birthDate = "errors.birthDateUnderage";
    }
  }

  if (!GENDER_VALUES.includes(data.gender)) {
    errors.gender = "errors.genderRequired";
  }

  if (data.email.trim() === "") {
    errors.email = "errors.emailRequired";
  } else if (!isValidEmail(data.email)) {
    errors.email = "errors.emailInvalid";
  }

  if (!LANGUAGE_OPTIONS.some((option) => option.value === data.language)) {
    errors.language = "errors.languageRequired";
  }

  return errors;
};
