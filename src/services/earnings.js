// AI-assisted: see docs/AI_LOG.md #28, #31
// Earnings of the driver (section 5): pure functions that useEarnings and the
// history screen use. They only add up the amounts saved on each trip when it
// was completed (calculateFare in src/config/pricing.js); they never recompute
// a fare. Periods use the phone's local time.

// Periods shown on the earnings and history screens, in this order
export const PERIODS = ["today", "week", "month"];

const DAY_MS = 24 * 60 * 60 * 1000;

// Amounts are integer pesos; a missing or broken amount counts as 0
const amount = (value) => (Number.isFinite(value) ? value : 0);

/**
 * completedAt of a trip in milliseconds, or null. Accepts a Firestore
 * Timestamp, a Date or a number of milliseconds.
 */
export const completedAtMillis = (trip) => {
  const value = trip?.completedAt;
  if (value == null) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return null;
};

/**
 * Start of today, of this week (Monday) and of this month for `now`, in
 * milliseconds of the phone's local time.
 */
export const periodStarts = (now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // getDay(): 0 = Sunday … 6 = Saturday. Days since Monday: Sunday is 6.
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const week = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysSinceMonday,
  );
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    today: today.getTime(),
    week: week.getTime(),
    month: month.getTime(),
  };
};

/**
 * Oldest completedAt the earnings need: the start of the month or of the week,
 * whichever is earlier (a week can start in the previous month).
 */
export const earningsQueryStart = (now = new Date()) => {
  const starts = periodStarts(now);
  return Math.min(starts.week, starts.month);
};

/**
 * Trips completed in `period` ("today", "week" or "month") up to the end of
 * today. Trips without completedAt are left out.
 */
export const filterTripsByPeriod = (trips, period, now = new Date()) => {
  const start = periodStarts(now)[period];
  if (start === undefined) throw new Error(`Unknown period: ${period}`);
  const end = periodStarts(now).today + DAY_MS;
  return trips.filter((trip) => {
    const completedAt = completedAtMillis(trip);
    return completedAt !== null && completedAt >= start && completedAt < end;
  });
};

/**
 * Totals of a list of trips: number of trips, total billed (fare),
 * commissions, tips, net earnings (driverEarnings) and the average net
 * earnings per trip (integer pesos, 0 without trips).
 */
export const summarizeTrips = (trips) => {
  const totals = trips.reduce(
    (sum, trip) => ({
      tripCount: sum.tripCount + 1,
      totalFare: sum.totalFare + amount(trip.fare),
      totalCommission: sum.totalCommission + amount(trip.commission),
      totalTips: sum.totalTips + amount(trip.tip),
      netEarnings: sum.netEarnings + amount(trip.driverEarnings),
    }),
    {
      tripCount: 0,
      totalFare: 0,
      totalCommission: 0,
      totalTips: 0,
      netEarnings: 0,
    },
  );
  return {
    ...totals,
    averagePerTrip:
      totals.tripCount === 0
        ? 0
        : Math.round(totals.netEarnings / totals.tripCount),
  };
};

/**
 * Balance with the platform: what the platform owes the driver for trips paid
 * with Mercado Pago (driverEarnings of those trips with status "paid") minus
 * what the driver owes for cash trips (their commission, because the driver
 * kept the whole fare). Positive: the platform owes the driver.
 */
export const calculateBalance = (trips) =>
  trips.reduce((balance, trip) => {
    if (trip.paymentMethod === "mercadopago" && trip.status === "paid") {
      return balance + amount(trip.driverEarnings);
    }
    if (trip.paymentMethod === "cash") {
      return balance - amount(trip.commission);
    }
    return balance;
  }, 0);

// Days of the week in the chart, Monday first (keys "weekday.<day>")
export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/**
 * Net earnings of each day of this week, Monday to Sunday: seven items
 * { day, netEarnings, isToday }. Days without trips have 0.
 */
export const weeklyEarnings = (trips, now = new Date()) => {
  const weekStart = new Date(periodStarts(now).week);
  return WEEK_DAYS.map((day, index) => {
    const start = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + index,
    ).getTime();
    const end = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + index + 1,
    ).getTime();
    const dayTrips = trips.filter((trip) => {
      const completedAt = completedAtMillis(trip);
      return completedAt !== null && completedAt >= start && completedAt < end;
    });
    return {
      day,
      netEarnings: summarizeTrips(dayTrips).netEarnings,
      isToday: start === periodStarts(now).today,
    };
  });
};

/**
 * Everything the earnings screen shows: { today, week, month, balance,
 * weekDays }. Each period has the totals of summarizeTrips; the balance is the
 * one of this month's trips; weekDays is weeklyEarnings for the chart.
 */
export const calculateEarnings = (trips, now = new Date()) => {
  const byPeriod = Object.fromEntries(
    PERIODS.map((period) => [period, filterTripsByPeriod(trips, period, now)]),
  );
  return {
    ...Object.fromEntries(
      PERIODS.map((period) => [period, summarizeTrips(byPeriod[period])]),
    ),
    balance: calculateBalance(byPeriod.month),
    weekDays: weeklyEarnings(trips, now),
  };
};
