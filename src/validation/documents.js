// AI-assisted: see docs/AI_LOG.md #7, #12
// Pestaña 3: documentos y pagos. Los errores son claves de traducción
// (src/i18n/strings.js), igual que en la pestaña 1.
import { parseISODate, toISODate } from "./dates";
import { isValidEmail } from "./personalInfo";

export const DOCUMENT_FIELDS = [
  "licenseNumber",
  "licensePhoto",
  "licenseExpiry",
  "soatPhoto",
  "soatExpiry",
  "techReviewPhoto",
  "techReviewExpiry",
  "mercadoPagoEmail",
  "acceptedTerms",
];

// Año desde el que un carro particular nuevo necesita revisión técnico-mecánica.
// Las fuentes no coinciden: la Sentencia C-745/12 transcribe el sexto año (Decreto
// 019 de 2012, art. 202) y un documento del RUNT de 2023 dice el quinto. Se usa 5,
// la más reciente, y el año del modelo como aproximación del año de matrícula.
export const TECH_REVIEW_FIRST_YEAR = 5;

// Sin un año válido no se puede saber: no se exige (la pestaña 2 ya pide el año)
export const requiresTechReview = (vehicleYear, today = new Date()) => {
  const year = String(vehicleYear ?? "").trim();
  if (!/^\d{4}$/.test(year)) return false;
  return today.getFullYear() - Number(year) >= TECH_REVIEW_FIRST_YEAR;
};

const LICENSE_NUMBER_REGEX = /^\d+$/;

// El enunciado pide que cada vencimiento sea posterior a hoy. Las fechas "AAAA-MM-DD"
// se comparan como texto porque ese formato ordena igual que las fechas.
const validateExpiry = (value, prefix, today) => {
  if (value === "") return `errors.${prefix}ExpiryRequired`;
  const date = parseISODate(value);
  if (!date) return "errors.expiryInvalid";
  if (toISODate(date) <= toISODate(today)) return `errors.${prefix}Expired`;
  return null;
};

// today se puede inyectar para que las pruebas no dependan de la fecha real
export const validateDocuments = (data, today = new Date()) => {
  const errors = {};

  const licenseNumber = data.licenseNumber.trim();
  if (licenseNumber === "") {
    errors.licenseNumber = "errors.licenseNumberRequired";
  } else if (!LICENSE_NUMBER_REGEX.test(licenseNumber)) {
    errors.licenseNumber = "errors.licenseNumberInvalid";
  }
  if (data.licensePhoto === "") {
    errors.licensePhoto = "errors.licensePhotoRequired";
  }
  const licenseExpiry = validateExpiry(data.licenseExpiry, "license", today);
  if (licenseExpiry) errors.licenseExpiry = licenseExpiry;

  if (data.soatPhoto === "") {
    errors.soatPhoto = "errors.soatPhotoRequired";
  }
  const soatExpiry = validateExpiry(data.soatExpiry, "soat", today);
  if (soatExpiry) errors.soatExpiry = soatExpiry;

  if (requiresTechReview(data.year, today)) {
    if (data.techReviewPhoto === "") {
      errors.techReviewPhoto = "errors.techReviewPhotoRequired";
    }
    const techReviewExpiry = validateExpiry(
      data.techReviewExpiry,
      "techReview",
      today,
    );
    if (techReviewExpiry) errors.techReviewExpiry = techReviewExpiry;
  }

  if (data.mercadoPagoEmail.trim() === "") {
    errors.mercadoPagoEmail = "errors.mercadoPagoEmailRequired";
  } else if (!isValidEmail(data.mercadoPagoEmail)) {
    errors.mercadoPagoEmail = "errors.mercadoPagoEmailInvalid";
  }

  if (data.acceptedTerms !== true) {
    errors.acceptedTerms = "errors.termsRequired";
  }

  return errors;
};
