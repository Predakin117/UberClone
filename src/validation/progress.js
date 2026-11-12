// AI-assisted: see docs/AI_LOG.md #56
// Registration progress for the step bar. It only reads the validators of the
// 3 tabs, it doesn't add rules: a field counts as done when it is filled in and
// has no error. Fields that aren't needed (empty and without error, like the
// vehicle inspection of a new car) don't count.
import { DOCUMENT_FIELDS, validateDocuments } from "./documents";
import { PERSONAL_FIELDS, validatePersonalInfo } from "./personalInfo";
import { VEHICLE_FIELDS, validateVehicle } from "./vehicle";

// name is the route name of each tab in src/navigation/AuthTabs.js
export const REGISTRATION_STEPS = [
  {
    name: "PersonalInfo",
    fields: PERSONAL_FIELDS,
    validate: validatePersonalInfo,
  },
  { name: "Vehicle", fields: VEHICLE_FIELDS, validate: validateVehicle },
  { name: "Documents", fields: DOCUMENT_FIELDS, validate: validateDocuments },
];

const isFilled = (value) =>
  value !== undefined && value !== null && value !== "" && value !== false;

export const getRegistrationProgress = (data, today = new Date()) => {
  const steps = REGISTRATION_STEPS.map(({ name, fields, validate }) => {
    const errors = validate(data, today);
    const needed = fields.filter(
      (field) => errors[field] || isFilled(data[field]),
    );
    const done = needed.filter((field) => !errors[field]).length;
    return {
      name,
      done,
      total: needed.length,
      isComplete: Object.keys(errors).length === 0,
    };
  });

  const done = steps.reduce((sum, step) => sum + step.done, 0);
  const total = steps.reduce((sum, step) => sum + step.total, 0);
  const isComplete = steps.every((step) => step.isComplete);

  // 100 % only when the 3 tabs are really valid
  const percent = isComplete
    ? 100
    : Math.min(99, Math.round((done / Math.max(total, 1)) * 100));

  return { steps, percent, isComplete };
};
