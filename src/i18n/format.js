// AI-assisted: see docs/AI_LOG.md #28, #31
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
