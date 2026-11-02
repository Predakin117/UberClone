// AI-assisted: see docs/AI_LOG.md #6
// Versión temporal para que la base funcione. La reemplaza la de la rama ximena/pestana-2:
// si Git marca conflicto en este archivo, se conserva la versión de esa rama.
export const CATEGORY_OPTIONS = [];
export const COLOR_OPTIONS = [];
export const VEHICLE_FIELDS = ["vehicleMake", "plate"];

export const normalizePlate = (text) => text.trim().toUpperCase();

export const validateVehicle = (data) => {
  const errors = {};

  if (data.vehicleMake.trim() === "") {
    errors.vehicleMake = "La marca es obligatoria";
  }
  if (data.plate.trim() === "") {
    errors.plate = "La placa es obligatoria";
  }

  return errors;
};
