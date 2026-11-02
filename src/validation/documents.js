// AI-assisted: see docs/AI_LOG.md #7
export const DOCUMENT_FIELDS = ["licenseNumber"];

export const validateDocuments = (data) => {
  const errors = {};

  if (data.licenseNumber.trim() === "") {
    errors.licenseNumber = "El número de licencia es obligatorio";
  }

  return errors;
};
