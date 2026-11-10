// AI-assisted: see docs/AI_LOG.md #53
// Login and sign-up rules. Errors are translation keys (src/i18n/strings.js).
import { validateLoginPhone } from "./phone";
import { isValidEmail } from "./personalInfo";

export const MIN_PASSWORD_LENGTH = 8;

export const LOGIN_METHODS = ["phone", "email"];

export const normalizeEmail = (email) => email.trim().toLowerCase();

// Id of the loginIndex document for an email or an international phone number.
// encodeURIComponent keeps characters that Firestore ids don't allow, like "/", out.
export const buildLoginKey = (method, value) =>
  `${method}_${encodeURIComponent(
    method === "email" ? normalizeEmail(value) : value,
  )}`;

export const validateLoginEmail = (email) => {
  if (email.trim() === "") return { email: "errors.emailRequired" };
  if (!isValidEmail(email)) return { email: "errors.emailInvalid" };
  return {};
};

export const validatePassword = (password) => {
  if (password === "") return { password: "errors.passwordRequired" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { password: "errors.passwordTooShort" };
  }
  return {};
};

// First step of the login: only the field of the chosen method is checked
export const validateLoginIdentifier = ({
  method,
  email,
  countryCode,
  phone,
}) =>
  method === "email"
    ? validateLoginEmail(email)
    : validateLoginPhone({ countryCode, phone });

export const validateNewAccount = ({
  email,
  countryCode,
  phone,
  password,
  confirmPassword,
}) => {
  const errors = {
    ...validateLoginEmail(email),
    ...validateLoginPhone({ countryCode, phone }),
    ...validatePassword(password),
  };

  if (confirmPassword === "") {
    errors.confirmPassword = "errors.confirmPasswordRequired";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "errors.passwordMismatch";
  }

  return errors;
};

// Firebase error codes → translation keys. Wrong password and unknown user share
// one message on purpose, so the screen doesn't tell which one failed.
const AUTH_ERROR_KEYS = {
  "auth/invalid-credential": "auth.wrongPassword",
  "auth/wrong-password": "auth.wrongPassword",
  "auth/user-not-found": "auth.wrongPassword",
  "auth/too-many-requests": "auth.tooManyRequests",
  "auth/network-request-failed": "auth.network",
  "auth/email-already-in-use": "auth.emailInUse",
  "auth/weak-password": "errors.passwordTooShort",
  "auth/phone-in-use": "auth.phoneInUse",
  "auth/not-configured": "auth.notConfigured",
  "permission-denied": "auth.permissionDenied",
  unavailable: "auth.network",
};

export const AUTH_ERROR_CODES = Object.keys(AUTH_ERROR_KEYS);

export const authErrorKey = (code) => AUTH_ERROR_KEYS[code] ?? "auth.failed";
