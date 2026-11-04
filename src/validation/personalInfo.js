// AI-assisted: see docs/AI_LOG.md #7
// Base de la pestaña 1: las demás reglas se agregan en la rama tamiro/pestana-1.
export const PERSONAL_FIELDS = ["name", "email"];

// Formato básico usuario@dominio.ext
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validatePersonalInfo = (data) => {
  const errors = {};

  if (data.name.trim() === "") {
    errors.name = "El nombre es obligatorio";
  }
  if (!isValidEmail(data.email)) {
    errors.email = "Ingresa un correo electrónico válido";
  }

  return errors;
};
