// AI-assisted: see docs/AI_LOG.md #9
// Las fechas del registro se guardan como texto "AAAA-MM-DD" en hora local.
// No se usa new Date("AAAA-MM-DD") porque lo interpreta en UTC y en Colombia
// (UTC-5) quedaría un día antes.

const pad = (number) => String(number).padStart(2, "0");

export const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Devuelve null si el texto no es una fecha real (por ejemplo 2023-02-30)
export const parseISODate = (text) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return toISODate(date) === text ? date : null;
};

export const formatDisplayDate = (text) => {
  const date = parseISODate(text);
  if (!date) return "";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

// Misma fecha de hoy, N años atrás. Un 29 de febrero pasa al 28 si el año no es bisiesto.
export const yearsAgo = (years, today = new Date()) => {
  const date = new Date(today.getFullYear() - years, today.getMonth(), 1);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  date.setDate(Math.min(today.getDate(), lastDay));
  return date;
};

// AI-assisted: see docs/AI_LOG.md #12
// Misma hora, N días después (o antes si days es negativo)
export const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// Años cumplidos a la fecha de hoy
export const getAge = (birthDate, today = new Date()) => {
  const age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPending =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());
  return birthdayPending ? age - 1 : age;
};
