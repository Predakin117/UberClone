// AI-assisted: see docs/AI_LOG.md #28, #31, #60, #61
// Formats for amounts and dates shown on screen, by language.

const LOCALES = { es: "es-CO", en: "en-US" };

// Integer pesos: $12.300 COP
export const formatCop = (amount) =>
  `$${Math.round(Number(amount) || 0).toLocaleString("es-CO")} COP`;

// Signed amount for balances: -$1.200 COP
export const formatSignedCop = (amount) =>
  `${amount < 0 ? "-" : ""}${formatCop(Math.abs(amount))}`;

// Date and time of a trip, e.g. "12 nov, 3:05 p. m." in Spanish
export const formatDateTime = (millis, language) =>
  millis == null
    ? ""
    : new Date(millis).toLocaleString(LOCALES[language] ?? LOCALES.es, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });

// Number with at most one decimal in the language's format: 2,4 or 2.4
export const formatDecimal = (value, language) =>
  Number(value).toLocaleString(LOCALES[language] ?? LOCALES.es, {
    maximumFractionDigits: 1,
  });

// AI-assisted: see docs/AI_LOG.md #60
// Day header of the history, e.g. "mié, 12 nov" in Spanish
export const formatDay = (millis, language) =>
  new Date(millis).toLocaleDateString(LOCALES[language] ?? LOCALES.es, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// Time of a trip, e.g. "3:05 p. m." in Spanish
export const formatTime = (millis, language) =>
  millis == null
    ? ""
    : new Date(millis).toLocaleTimeString(LOCALES[language] ?? LOCALES.es, {
        hour: "numeric",
        minute: "2-digit",
      });

// AI-assisted: see docs/AI_LOG.md #61
// Short date for the week navigator, e.g. "9 nov" in Spanish
export const formatShortDate = (millis, language) =>
  new Date(millis).toLocaleDateString(LOCALES[language] ?? LOCALES.es, {
    day: "numeric",
    month: "short",
  });

// Month and year for "member since", e.g. "nov 2026" in Spanish
export const formatMonthYear = (millis, language) =>
  millis == null
    ? ""
    : new Date(millis).toLocaleDateString(LOCALES[language] ?? LOCALES.es, {
        month: "short",
        year: "numeric",
      });
