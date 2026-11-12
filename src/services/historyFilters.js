// AI-assisted: see docs/AI_LOG.md #60
// Filters and grouping of the trip history (section 6): a date range, the
// payment method and the trips grouped by day, newest day first. Pure
// functions over the trips the history already loaded; dates use the phone's
// local time, like src/services/earnings.js.
import { parseISODate } from "../validation/dates";
import { completedAtMillis, PERIODS } from "./earnings";
import { PAYMENT_METHODS } from "./trips";

// History filters: the three periods of the earnings plus a custom range
export const HISTORY_PERIODS = [...PERIODS, "range"];

// "all" or one payment method of the trips
export const PAYMENT_FILTERS = ["all", ...PAYMENT_METHODS];

const startOfDay = (millis) => {
  const date = new Date(millis);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
};

/**
 * Trips completed from the day `from` to the day `to`, both included. from
 * and to are "YYYY-MM-DD" texts; an invalid one leaves the list empty.
 */
export const filterTripsByDateRange = (trips, from, to) => {
  const fromDate = parseISODate(from);
  const toDate = parseISODate(to);
  if (!fromDate || !toDate) return [];
  const start = fromDate.getTime();
  // The end is the start of the day after `to`
  const end = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate() + 1,
  ).getTime();
  return trips.filter((trip) => {
    const completedAt = completedAtMillis(trip);
    return completedAt !== null && completedAt >= start && completedAt < end;
  });
};

/** Trips paid with `method`, or all of them with "all". */
export const filterTripsByPaymentMethod = (trips, method) =>
  method === "all"
    ? trips
    : trips.filter((trip) => trip.paymentMethod === method);

/**
 * Groups trips (already sorted newest first) by the day they were completed:
 * [{ dayStart, trips }], keeping the order. Trips without completedAt are
 * left out.
 */
export const groupTripsByDay = (trips) => {
  const days = [];
  for (const trip of trips) {
    const completedAt = completedAtMillis(trip);
    if (completedAt === null) continue;
    const dayStart = startOfDay(completedAt);
    const last = days[days.length - 1];
    if (last?.dayStart === dayStart) {
      last.trips.push(trip);
    } else {
      days.push({ dayStart, trips: [trip] });
    }
  }
  return days;
};

/**
 * "today", "yesterday" or null for the day that starts at dayStart, so the
 * screen can write "Today", "Yesterday" or the date.
 */
export const relativeDay = (dayStart, now = new Date()) => {
  const today = startOfDay(now.getTime());
  if (dayStart === today) return "today";
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  ).getTime();
  if (dayStart === yesterday) return "yesterday";
  return null;
};
