import { calculateFare } from "./pricing";

// Ejemplo del enunciado (sección 5): viaje de 8,5 km y 22 minutos, sin propina
const trip = { distanceKm: 8.5, durationMin: 22 };

describe("calculateFare", () => {
  it("calcula el ejemplo Económico del enunciado", () => {
    // 3.500 + 10.200 + 5.500 = 19.200
    expect(calculateFare({ ...trip, category: "economy" })).toEqual({
      fare: 19200,
      commission: 3840,
      driverEarnings: 15360,
      commissionRate: 0.2,
      tip: 0,
    });
  });

  it("calcula el ejemplo XL del enunciado, redondeando antes de la comisión", () => {
    // 19.200 × 1,4 = 26.880 → 26.900
    const result = calculateFare({ ...trip, category: "xl" });
    expect(result.fare).toBe(26900);
    expect(result.commission).toBe(5380);
    expect(result.driverEarnings).toBe(21520);
  });

  it("aplica el multiplicador Premium", () => {
    // 19.200 × 1,8 = 34.560 → 34.600
    expect(calculateFare({ ...trip, category: "premium" }).fare).toBe(34600);
  });

  it("usa Económico si no se indica la categoría", () => {
    expect(calculateFare(trip).fare).toBe(19200);
  });

  it("aplica la tarifa mínima de 6.000 COP", () => {
    // 3.500 + 1.200 + 250 = 4.950
    expect(calculateFare({ distanceKm: 1, durationMin: 1 }).fare).toBe(6000);
  });

  it("deja la propina completa al conductor y nunca negativa", () => {
    expect(calculateFare({ ...trip, tip: 2000 }).driverEarnings).toBe(17360);
    const negative = calculateFare({ ...trip, tip: -500 });
    expect(negative.tip).toBe(0);
    expect(negative.driverEarnings).toBe(15360);
  });

  it("rechaza una categoría desconocida", () => {
    expect(() => calculateFare({ ...trip, category: "standard" })).toThrow();
  });
});
