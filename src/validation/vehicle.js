// AI-assisted: see docs/AI_LOG.md #50
// Las mismas categorías que elige el pasajero (valores en inglés, como en la colección trips)
export const CATEGORY_OPTIONS = [
  { value: "economy", label: "Económico" },
  { value: "xl", label: "XL" },
  { value: "premium", label: "Premium" },
];

export const COLOR_OPTIONS = [
  { value: "white", label: "Blanco" },
  { value: "black", label: "Negro" },
  { value: "gray", label: "Gris" },
  { value: "silver", label: "Plata" },
  { value: "red", label: "Rojo" },
  { value: "blue", label: "Azul" },
  { value: "other", label: "Otro" },
];

export const VEHICLE_FIELDS = [
  "category",
  "plate",
  "vehicleMake",
  "vehicleModel",
  "year",
  "color",
  "capacity",
  "vehiclePhoto",
];

const MAX_NAME_LENGTH = 30;
const XL_MIN_CAPACITY = 6;

// Placa de carro en Colombia: tres letras y tres números (ABC123)
const PLATE_REGEX = /^[A-Z]{3}\d{3}$/;

// Mayúsculas antes de validar; los guiones no se quitan, así que ABC-123 es inválida
export const normalizePlate = (text) => text.trim().toUpperCase();

const isOption = (options, value) =>
  options.some((option) => option.value === value);

const validateName = (value, label) => {
  if (value.trim() === "") return `La ${label} es obligatoria`;
  if (value.trim().length > MAX_NAME_LENGTH) {
    return `La ${label} admite máximo ${MAX_NAME_LENGTH} caracteres`;
  }
  return null;
};

export const validateVehicle = (data) => {
  const errors = {};
  const currentYear = new Date().getFullYear();

  if (!isOption(CATEGORY_OPTIONS, data.category)) {
    errors.category = "Selecciona la categoría";
  }

  const plate = normalizePlate(data.plate);
  if (plate === "") {
    errors.plate = "La placa es obligatoria";
  } else if (!PLATE_REGEX.test(plate)) {
    errors.plate = "La placa debe tener el formato ABC123";
  }

  const makeError = validateName(data.vehicleMake, "marca");
  if (makeError) errors.vehicleMake = makeError;

  const modelError = validateName(data.vehicleModel, "línea o modelo");
  if (modelError) errors.vehicleModel = modelError;

  if (data.year.trim() === "") {
    errors.year = "El año es obligatorio";
  } else if (!/^\d{4}$/.test(data.year)) {
    errors.year = "El año debe tener 4 dígitos";
  } else if (Number(data.year) > currentYear) {
    errors.year = `El año no puede ser mayor a ${currentYear}`;
  }

  if (!isOption(COLOR_OPTIONS, data.color)) {
    errors.color = "Selecciona el color";
  }

  if (data.capacity.trim() === "") {
    errors.capacity = "La capacidad es obligatoria";
  } else if (!/^\d+$/.test(data.capacity) || Number(data.capacity) < 1) {
    errors.capacity = "La capacidad debe ser un número mayor a 0";
  } else if (data.category === "xl" && Number(data.capacity) < XL_MIN_CAPACITY) {
    errors.capacity = `La categoría XL exige mínimo ${XL_MIN_CAPACITY} pasajeros`;
  }

  if (data.vehiclePhoto === "") {
    errors.vehiclePhoto = "La foto del vehículo es obligatoria";
  }

  return errors;
};
