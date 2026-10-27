import { calculateFare } from "./pricing";

describe("calculateFare", () => {
  it("redondea al múltiplo de 100 COP más cercano", () => {
    // 4000 + 5 * 1200 + 15 * 200 = 13000
    expect(calculateFare({ distanceKm: 5, durationMin: 15 }).fare).toBe(13000);
    // 4000 + 1.33 * 1200 + 0 = 5596 → 5600
    expect(calculateFare({ distanceKm: 1.33, durationMin: 0 }).fare).toBe(5600);
  });

  it("aplica la tarifa mínima de 5000 COP", () => {
    expect(calculateFare({ distanceKm: 0, durationMin: 0 }).fare).toBe(5000);
  });

  it("cobra 20% de comisión y deja la propina completa al conductor", () => {
    const result = calculateFare({ distanceKm: 5, durationMin: 15, tip: 2000 });
    expect(result.commissionRate).toBe(0.2);
    expect(result.commission).toBe(2600);
    expect(result.driverEarnings).toBe(13000 - 2600 + 2000);
  });

  it("usa la tarifa premium cuando se indica", () => {
    // 6500 + 5 * 1800 + 15 * 300 = 20000
    const result = calculateFare({
      distanceKm: 5,
      durationMin: 15,
      category: "premium",
    });
    expect(result.fare).toBe(20000);
  });

  it("ignora propinas negativas", () => {
    const result = calculateFare({ distanceKm: 5, durationMin: 15, tip: -500 });
    expect(result.tip).toBe(0);
    expect(result.driverEarnings).toBe(10400);
  });
});
