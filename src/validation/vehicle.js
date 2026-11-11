// AI-assisted: see docs/AI_LOG.md #50, #54
// Tab 2: vehicle. Errors are translation keys (src/i18n/strings.js), same as in
// tabs 1 and 3, so the screen shows them in the chosen language.

// Same categories the passenger picks (values in English, as in the trips collection).
// The labels are in strings.js as "category.<value>" and "color.<value>".
export const CATEGORY_VALUES = ["economy", "xl", "premium"];
export const COLOR_VALUES = [
  "white",
  "black",
  "gray",
  "silver",
  "red",
  "blue",
  "other",
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

export const MAX_VEHICLE_NAME_LENGTH = 30;
// Like Uber: a car with at least 4 seats for passengers (6 for XL)
export const MIN_CAPACITY = 4;
export const XL_MIN_CAPACITY = 6;
export const MAX_CAPACITY = 8;
// Older vehicles are not accepted
export const MAX_VEHICLE_AGE = 20;

// Colombian car plate: three letters and three numbers (ABC123)
const PLATE_REGEX = /^[A-Z]{3}\d{3}$/;
// Make: letters, spaces and hyphens (Mercedes-Benz). At least 2 letters.
const MAKE_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+([ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
// Model: also numbers and dots (Spark GT, CX-5, Model 3, 1.6)
const MODEL_REGEX =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+([ .-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)*$/;

// Uppercase before validating; hyphens are kept, so ABC-123 is invalid
export const normalizePlate = (text) => text.trim().toUpperCase();

// Collapses repeated spaces: "Spark   GT" → "Spark GT"
const cleanText = (text) => text.trim().replace(/\s+/g, " ");

export const minVehicleYear = (today = new Date()) =>
  today.getFullYear() - MAX_VEHICLE_AGE;

const validateMake = (value) => {
  const make = cleanText(value);
  if (make === "") return "errors.vehicleMakeRequired";
  if (make.length > MAX_VEHICLE_NAME_LENGTH) return "errors.vehicleMakeTooLong";
  if (make.length < 2 || !MAKE_REGEX.test(make)) {
    return "errors.vehicleMakeInvalid";
  }
  return null;
};

const validateModel = (value) => {
  const model = cleanText(value);
  if (model === "") return "errors.vehicleModelRequired";
  if (model.length > MAX_VEHICLE_NAME_LENGTH) {
    return "errors.vehicleModelTooLong";
  }
  if (!MODEL_REGEX.test(model)) return "errors.vehicleModelInvalid";
  return null;
};

// today can be injected so the tests don't depend on the real date
export const validateVehicle = (data, today = new Date()) => {
  const errors = {};
  const currentYear = today.getFullYear();

  if (!CATEGORY_VALUES.includes(data.category)) {
    errors.category = "errors.categoryRequired";
  }

  const plate = normalizePlate(data.plate);
  if (plate === "") {
    errors.plate = "errors.plateRequired";
  } else if (!PLATE_REGEX.test(plate)) {
    errors.plate = "errors.plateInvalid";
  }

  const makeError = validateMake(data.vehicleMake);
  if (makeError) errors.vehicleMake = makeError;

  const modelError = validateModel(data.vehicleModel);
  if (modelError) errors.vehicleModel = modelError;

  const year = data.year.trim();
  if (year === "") {
    errors.year = "errors.yearRequired";
  } else if (!/^\d{4}$/.test(year)) {
    errors.year = "errors.yearInvalid";
  } else if (Number(year) > currentYear) {
    errors.year = "errors.yearFuture";
  } else if (Number(year) < minVehicleYear(today)) {
    errors.year = "errors.yearTooOld";
  }

  if (!COLOR_VALUES.includes(data.color)) {
    errors.color = "errors.colorRequired";
  }

  const capacity = data.capacity.trim();
  const minCapacity =
    data.category === "xl" ? XL_MIN_CAPACITY : MIN_CAPACITY;
  if (capacity === "") {
    errors.capacity = "errors.capacityRequired";
  } else if (!/^\d+$/.test(capacity)) {
    errors.capacity = "errors.capacityInvalid";
  } else if (Number(capacity) > MAX_CAPACITY) {
    errors.capacity = "errors.capacityTooHigh";
  } else if (Number(capacity) < minCapacity) {
    errors.capacity =
      data.category === "xl" ? "errors.capacityXl" : "errors.capacityTooLow";
  }

  if (data.vehiclePhoto === "") {
    errors.vehiclePhoto = "errors.vehiclePhotoRequired";
  }

  return errors;
};
