// AI-assisted: see docs/AI_LOG.md #12, #15, #18
// Tarifa, comisión y ganancia del conductor (sección 5 del enunciado). Todos los
// valores se configuran aquí y se manejan en pesos colombianos enteros.
// Son valores didácticos, no tarifas reales.
// firestore.rules repite estos valores para revisar los montos al completar un
// viaje: si cambian aquí, hay que cambiarlos allá.

export const BASE_FARE = 3500;
export const PRICE_PER_KM = 1200;
export const PRICE_PER_MIN = 250;
export const MIN_FARE = 6000;

// Las mismas categorías que elige el pasajero (valores de vehicle.js)
export const CATEGORY_MULTIPLIERS = { economy: 1.0, xl: 1.4, premium: 1.8 };

// Comisión de la plataforma: la usa calculateFare y la muestra la pestaña 3
export const COMMISSION_RATE = 0.2;

const ROUND_TO = 100;

/**
 * Función pura que usan la estimación del pasajero y el cierre del viaje.
 * distanceKm y durationMin salen de la ruta; la propina va completa al conductor.
 * Devuelve { fare, commission, driverEarnings, commissionRate, tip }; commissionRate
 * se guarda con cada viaje para que un cambio futuro no altere el historial.
 */
export const calculateFare = ({
  distanceKm,
  durationMin,
  category = "economy",
  tip = 0,
}) => {
  const multiplier = CATEGORY_MULTIPLIERS[category];
  if (multiplier === undefined) {
    throw new Error(`Categoría desconocida: ${category}`);
  }

  const subtotal =
    BASE_FARE + distanceKm * PRICE_PER_KM + durationMin * PRICE_PER_MIN;

  // La tarifa se redondea al múltiplo de 100 COP más cercano antes de la comisión
  const fare = Math.max(
    MIN_FARE,
    Math.round((subtotal * multiplier) / ROUND_TO) * ROUND_TO,
  );
  const commission = Math.round(fare * COMMISSION_RATE);

  // Propinas completas al conductor, en pesos enteros y nunca negativas
  const safeTip = Math.max(0, Math.round(tip || 0));

  return {
    fare,
    commission,
    driverEarnings: fare - commission + safeTip,
    commissionRate: COMMISSION_RATE,
    tip: safeTip,
  };
};
