// AI-assisted: see docs/AI_LOG.md #30
// Pure functions for the profile screen: average rating, document expiry
// warnings and the Firestore update of the editable fields.
import { addDays, parseISODate } from "../validation/dates";

// A document that expires in less than this many days shows a warning
export const EXPIRY_WARNING_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Average of the ratings (1 to 5) of the driver's trips, with one decimal.
 * Returns { average, count }; average is null when no trip has a rating.
 */
export const averageRating = (trips) => {
  const ratings = trips
    .map((trip) => trip.rating)
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
  if (ratings.length === 0) return { average: null, count: 0 };
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
};

/**
 * State of a document expiry date (text YYYY-MM-DD): "expired" before today,
 * "soon" if it expires in less than EXPIRY_WARNING_DAYS days, "ok" otherwise,
 * or "unknown" if the date is missing. daysLeft is 0 on the expiry day.
 */
export const expiryStatus = (expiry, today = new Date()) => {
  const date = parseISODate(expiry ?? "");
  if (!date) return { state: "unknown", daysLeft: null };
  const startOfToday = addDays(today, 0);
  // Rounded: a day can last 23 or 25 hours when the clock changes
  const daysLeft = Math.round((date - startOfToday) / DAY_MS);
  if (daysLeft < 0) return { state: "expired", daysLeft };
  if (daysLeft < EXPIRY_WARNING_DAYS) return { state: "soon", daysLeft };
  return { state: "ok", daysLeft };
};

/**
 * Editable values of the profile as they are in drivers/{uid}: the photo and
 * name of tab 1 and the Mercado Pago email of tab 3.
 */
export const profileValues = (driver) => ({
  profilePhoto: driver?.personal?.profilePhotoUrl ?? "",
  name: driver?.personal?.name ?? "",
  mercadoPagoEmail: driver?.documents?.mercadoPagoEmail ?? "",
});

/**
 * Firestore update (dotted paths) with only the fields that changed, cleaned
 * the same way as the registration. It never includes status, so the rules
 * accept it without a new approval. Empty object if nothing changed.
 */
export const profileUpdate = (driver, values) => {
  const current = profileValues(driver);
  const name = values.name.trim().replace(/\s+/g, " ");
  const mercadoPagoEmail = values.mercadoPagoEmail.trim().toLowerCase();
  const update = {};
  if (values.profilePhoto !== current.profilePhoto) {
    update["personal.profilePhotoUrl"] = values.profilePhoto;
  }
  if (name !== current.name) update["personal.name"] = name;
  if (mercadoPagoEmail !== current.mercadoPagoEmail) {
    update["documents.mercadoPagoEmail"] = mercadoPagoEmail;
  }
  return update;
};
