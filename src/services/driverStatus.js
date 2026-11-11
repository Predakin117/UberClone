// AI-assisted: see docs/AI_LOG.md #16
// Regla del enunciado (sección 2): después de enviar el registro, el conductor no
// puede ponerse Disponible hasta que su estado cambie a "approved". La aprobación
// se simula cambiando el campo status en la consola de Firebase.
export const APPROVED_STATUS = "approved";

/**
 * Recibe lo que devuelve useDriverStatus ({ status, isLoading, error }) y dice
 * por qué el conductor todavía no puede conectarse: una clave de
 * src/i18n/strings.js, o null si ya puede.
 */
export const getAvailabilityBlock = ({ status, isLoading, error }) => {
  if (isLoading) return "home.checkingStatus";
  if (error) return "home.statusError";
  if (status === APPROVED_STATUS) return null;
  if (status === "rejected") return "home.rejected";
  return "home.pendingApproval";
};
