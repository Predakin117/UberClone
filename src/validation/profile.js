// AI-assisted: see docs/AI_LOG.md #30
// Fields the driver can edit on the profile, with the same rules as the
// registration: name and photo of tab 1 and the Mercado Pago email of tab 3.
// Errors are keys of src/i18n/strings.js.
import { validateMercadoPagoEmail } from "./documents";
import { validateName } from "./personalInfo";

export const validateProfile = ({ profilePhoto, name, mercadoPagoEmail }) => {
  const errors = {};

  if (profilePhoto === "") errors.profilePhoto = "errors.profilePhotoRequired";

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateMercadoPagoEmail(mercadoPagoEmail);
  if (emailError) errors.mercadoPagoEmail = emailError;

  return errors;
};
