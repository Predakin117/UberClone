// AI-assisted: see docs/AI_LOG.md #12
// Platform commission: used by calculateFare and shown on tab 3
export const COMMISSION_RATE = 0.2;

export const calculateFare = ({
  distanceKm,
  durationMin,
  category = "standard",
  tip = 0,
}) => {
  // 1. Base rates (sample values for Medellín)
  const baseRates = {
    standard: { baseFare: 4000, pricePerKm: 1200, pricePerMin: 200 },
    premium: { baseFare: 6500, pricePerKm: 1800, pricePerMin: 300 },
  };

  const rates = baseRates[category] || baseRates.standard;

  // 2. Raw fare of the ride
  const rawFare =
    rates.baseFare +
    distanceKm * rates.pricePerKm +
    durationMin * rates.pricePerMin;

  // 3. Strict rule: round to the nearest multiple of 100 COP
  let finalFare = Math.round(rawFare / 100) * 100;

  // Minimum fare (e.g. 5000 COP)
  if (finalFare < 5000) finalFare = 5000;

  // 4. Strict rule: 20% commission for the platform
  const commissionRate = COMMISSION_RATE;
  const commission = finalFare * commissionRate;

  // 5. Strict rule: tips go 100% to the driver (never negative)
  const safeTip = Math.max(0, tip);
  const driverEarnings = finalFare - commission + safeTip;

  // Returns the exact object the requirements ask for
  return {
    fare: finalFare,
    commission,
    commissionRate, // Returned because the rule says: "commissionRate must be stored for every trip in the DB"
    driverEarnings,
    tip: safeTip,
  };
};
