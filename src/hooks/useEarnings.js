// AI-assisted: see docs/AI_LOG.md #28
// Earnings of the driver (section 5): totals for today, this week (since
// Monday) and this month, plus the balance with the platform. The logic is in
// the pure functions of src/services/earnings.js; this hook only memoizes it.
import { useMemo } from "react";
import { calculateEarnings } from "../services/earnings";

/**
 * trips: the list of useTripHistory. Returns { today, week, month, balance };
 * each period has tripCount, totalFare, totalCommission, totalTips,
 * netEarnings and averagePerTrip.
 */
export const useEarnings = (trips) =>
  useMemo(() => calculateEarnings(trips ?? []), [trips]);
