export const calculateFare = ({
  distanceKm,
  durationMin,
  category = "standard",
  tip = 0,
}) => {
  // 1. Definimos las tarifas base (Valores de ejemplo para Medellín)
  const baseRates = {
    standard: { baseFare: 4000, pricePerKm: 1200, pricePerMin: 200 },
    premium: { baseFare: 6500, pricePerKm: 1800, pricePerMin: 300 },
  };

  const rates = baseRates[category] || baseRates.standard;

  // 2. Cálculo bruto de la carrera
  const rawFare =
    rates.baseFare +
    distanceKm * rates.pricePerKm +
    durationMin * rates.pricePerMin;

  // 3. Regla estricta: Redondear al múltiplo de 100 COP más cercano
  let finalFare = Math.round(rawFare / 100) * 100;

  // Tarifa mínima de seguridad (Ej. 5000 COP)
  if (finalFare < 5000) finalFare = 5000;

  // 4. Regla estricta: Comisión del 20% para la plataforma
  const commissionRate = 0.2;
  const commission = finalFare * commissionRate;

  // 5. Regla estricta: Propinas 100% al conductor (nunca negativas)
  const safeTip = Math.max(0, tip);
  const driverEarnings = finalFare - commission + safeTip;

  // Retornamos el objeto exacto pedido en los requerimientos
  return {
    fare: finalFare,
    commission,
    commissionRate, // Lo devolvemos porque la regla dice: "Se debe guardar el commissionRate por cada viaje en la BD"
    driverEarnings,
    tip: safeTip,
  };
};
