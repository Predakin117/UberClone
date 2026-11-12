// AI-assisted: see docs/AI_LOG.md #7, #9, #54
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
// AI-assisted: see docs/AI_LOG.md #54
// Shared by every email field (login, sign-up, tab 1 and Mercado Pago)
export const MAX_EMAIL_LENGTH = 100;

// Letras (con tildes, ü y ñ) y espacios
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
// No leading 0 (Colombian ID numbers don't start with 0)
const DOCUMENT_REGEX = /^[1-9]\d{5,9}$/;
// Colombian mobile (10 digits starting with 3) or the international number of
// the account (+573001234567), which fills in this field after the sign-up
const PHONE_REGEX = /^(3\d{9}|\+[1-9]\d{7,14})$/;
// Same digit repeated, like 1111111: not a real number
const REPEATED_DIGITS_REGEX = /^(\d)\1+$/;

// user@domain.ext: letters, digits and . _ % + - before the @; a domain with
// letters, digits and hyphens; an extension of 2 or more letters. No spaces,
// no ".." and no dot at the start or the end of the user part.
const EMAIL_REGEX =
  /^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export const isValidEmail = (email) => {
  const value = email.trim();
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(value);
};

// Name and last name: at least two words of 2 or more letters
const hasFullName = (name) =>
  name.split(/\s+/).filter((word) => word.length >= 2).length >= 2;

// AI-assisted: see docs/AI_LOG.md #30
// Error key of the full name, or null. Shared by tab 1 and the profile.
export const validateName = (value) => {
  const name = value.trim();
  if (name === "") return "errors.nameRequired";
  if (name.length > MAX_NAME_LENGTH) return "errors.nameTooLong";
  if (!NAME_REGEX.test(name)) return "errors.nameInvalid";
  if (!hasFullName(name)) return "errors.nameIncomplete";
  return null;
};

// today se puede inyectar para que las pruebas no dependan de la fecha real
export const validatePersonalInfo = (data, today = new Date()) => {
  const errors = {};

  if (data.profilePhoto === "") {
    errors.profilePhoto = "errors.profilePhotoRequired";
  }

  const nameError = validateName(data.name);
  if (nameError) errors.name = nameError;

  const documentId = data.documentId.trim();
  if (documentId === "") {
    errors.documentId = "errors.documentIdRequired";
  } else if (!DOCUMENT_REGEX.test(documentId)) {
    errors.documentId = "errors.documentIdInvalid";
  } else if (REPEATED_DIGITS_REGEX.test(documentId)) {
    errors.documentId = "errors.documentIdRepeated";
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

// AI-assisted: see docs/AI_LOG.md #58
// True when everything in tab 1 is valid except the profile photo, which is
// still empty: then Next opens the selfie step instead of showing errors
export const isOnlyProfilePhotoMissing = (data, today = new Date()) => {
  const fields = Object.keys(validatePersonalInfo(data, today));
  return fields.length === 1 && fields[0] === "profilePhoto";
};
