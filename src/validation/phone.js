// AI-assisted: see docs/AI_LOG.md #52, #54
// Errors are translation keys (src/i18n/strings.js), same as in personalInfo.js.

// Mobile number digits without the country code or a leading 0.
// Argentina allows 10 or 11 because mobile numbers may start with an extra 9.
// mobilePrefix: first digit of every mobile number, when the country has one
// (in Colombia 6xx numbers are landlines and only 3xx are mobiles).
export const COUNTRIES = [
  { code: "CO", dialCode: "+57", flag: "🇨🇴", name: { es: "Colombia", en: "Colombia" }, minDigits: 10, maxDigits: 10, mobilePrefix: "3" },
  { code: "AR", dialCode: "+54", flag: "🇦🇷", name: { es: "Argentina", en: "Argentina" }, minDigits: 10, maxDigits: 11 },
  { code: "BO", dialCode: "+591", flag: "🇧🇴", name: { es: "Bolivia", en: "Bolivia" }, minDigits: 8, maxDigits: 8 },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: { es: "Brasil", en: "Brazil" }, minDigits: 11, maxDigits: 11 },
  { code: "CL", dialCode: "+56", flag: "🇨🇱", name: { es: "Chile", en: "Chile" }, minDigits: 9, maxDigits: 9 },
  { code: "CR", dialCode: "+506", flag: "🇨🇷", name: { es: "Costa Rica", en: "Costa Rica" }, minDigits: 8, maxDigits: 8 },
  { code: "EC", dialCode: "+593", flag: "🇪🇨", name: { es: "Ecuador", en: "Ecuador" }, minDigits: 9, maxDigits: 9 },
  { code: "SV", dialCode: "+503", flag: "🇸🇻", name: { es: "El Salvador", en: "El Salvador" }, minDigits: 8, maxDigits: 8 },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: { es: "España", en: "Spain" }, minDigits: 9, maxDigits: 9 },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: { es: "Estados Unidos", en: "United States" }, minDigits: 10, maxDigits: 10 },
  { code: "GT", dialCode: "+502", flag: "🇬🇹", name: { es: "Guatemala", en: "Guatemala" }, minDigits: 8, maxDigits: 8 },
  { code: "HN", dialCode: "+504", flag: "🇭🇳", name: { es: "Honduras", en: "Honduras" }, minDigits: 8, maxDigits: 8 },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", name: { es: "México", en: "Mexico" }, minDigits: 10, maxDigits: 10 },
  { code: "NI", dialCode: "+505", flag: "🇳🇮", name: { es: "Nicaragua", en: "Nicaragua" }, minDigits: 8, maxDigits: 8 },
  { code: "PA", dialCode: "+507", flag: "🇵🇦", name: { es: "Panamá", en: "Panama" }, minDigits: 8, maxDigits: 8 },
  { code: "PY", dialCode: "+595", flag: "🇵🇾", name: { es: "Paraguay", en: "Paraguay" }, minDigits: 9, maxDigits: 9 },
  { code: "PE", dialCode: "+51", flag: "🇵🇪", name: { es: "Perú", en: "Peru" }, minDigits: 9, maxDigits: 9 },
  { code: "DO", dialCode: "+1", flag: "🇩🇴", name: { es: "República Dominicana", en: "Dominican Republic" }, minDigits: 10, maxDigits: 10 },
  { code: "UY", dialCode: "+598", flag: "🇺🇾", name: { es: "Uruguay", en: "Uruguay" }, minDigits: 8, maxDigits: 8 },
  { code: "VE", dialCode: "+58", flag: "🇻🇪", name: { es: "Venezuela", en: "Venezuela" }, minDigits: 10, maxDigits: 10 },
];

export const DEFAULT_COUNTRY_CODE = "CO";

export const findCountry = (code) =>
  COUNTRIES.find((country) => country.code === code);

// Keeps only the digits: the driver may type "300 123-4567"
export const normalizePhone = (text) => text.replace(/[\s\-().]/g, "");

export const validateLoginPhone = ({ countryCode, phone }) => {
  const errors = {};
  const country = findCountry(countryCode);
  const digits = normalizePhone(phone);

  if (!country) {
    errors.countryCode = "errors.countryRequired";
  }

  if (digits === "") {
    errors.phone = "errors.loginPhoneRequired";
  } else if (!/^\d+$/.test(digits)) {
    errors.phone = "errors.loginPhoneInvalid";
  } else if (
    country &&
    (digits.length < country.minDigits || digits.length > country.maxDigits)
  ) {
    errors.phone = "errors.loginPhoneLength";
  } else if (country?.mobilePrefix && !digits.startsWith(country.mobilePrefix)) {
    errors.phone = "errors.loginPhoneNotMobile";
  } else if (/^\d(\d)\1+$/.test(digits)) {
    // Same digit after the first one, like 3000000000: not a real number
    errors.phone = "errors.loginPhoneFake";
  }

  return errors;
};

// International format (E.164) required by SMS services, e.g. +573001234567
export const toInternationalPhone = (countryCode, phone) =>
  `${findCountry(countryCode).dialCode}${normalizePhone(phone)}`;
