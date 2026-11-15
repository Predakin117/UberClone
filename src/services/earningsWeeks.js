// AI-assisted: see docs/AI_LOG.md #61
// Weeks of the earnings screen, like Uber: this week and the previous ones,
// Monday to Sunday, with the net earnings and trips of each day. Pure
// functions on top of src/services/earnings.js; they only add up the amounts
// saved on each trip. Weeks use the phone's local time.
import {
  WEEK_DAYS,
  completedAtMillis,
  earningsQueryStart,
  periodStarts,
  summarizeTrips,
} from "./earnings";

// How far back the driver can go: this week and the 11 before it (~3 months)
export const MAX_WEEKS_BACK = 11;

// Midnight of `days` days after the date of `millis`, in local time. Adding
// days to the date (not 24 h) keeps it right when the clock changes.
const addDays = (millis, days) => {
  const date = new Date(millis);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  ).getTime();
};

/**
 * Monday at midnight of the week weeksBack weeks before this one (0 = this
 * week, 1 = last week…), in milliseconds.
 */
export const weekStart = (weeksBack = 0, now = new Date()) =>
  addDays(periodStarts(now).week, -7 * weeksBack);

/**
 * Oldest completedAt the earnings screen needs to show weeksBack weeks back:
 * the start of that week, or of this month if it is earlier.
 */
export const earningsSince = (weeksBack = 0, now = new Date()) =>
  Math.min(earningsQueryStart(now), weekStart(weeksBack, now));

// Trips completed between start (included) and end (not included)
const tripsBetween = (trips, start, end) =>
  trips.filter((trip) => {
    const completedAt = completedAtMillis(trip);
    return completedAt !== null && completedAt >= start && completedAt < end;
  });

/**
 * Earnings of one week: { start, end, total, days }. total has the totals of
 * summarizeTrips for the whole week; days has seven items, Monday to Sunday:
 * { day, start, netEarnings, tripCount, isToday }.
 */
export const weekEarnings = (trips, weeksBack = 0, now = new Date()) => {
  const start = weekStart(weeksBack, now);
  const end = addDays(start, 7);
  const today = periodStarts(now).today;
  const weekTrips = tripsBetween(trips, start, end);

  const days = WEEK_DAYS.map((day, index) => {
    const dayStart = addDays(start, index);
    const summary = summarizeTrips(
      tripsBetween(weekTrips, dayStart, addDays(dayStart, 1)),
    );
    return {
      day,
      start: dayStart,
      netEarnings: summary.netEarnings,
      tripCount: summary.tripCount,
      isToday: dayStart === today,
    };
  });

  return { start, end, total: summarizeTrips(weekTrips), days };
};
