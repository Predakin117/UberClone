// AI-assisted: see docs/AI_LOG.md #28
import { calculateFare } from "../config/pricing";
import {
  calculateBalance,
  calculateEarnings,
  completedAtMillis,
  earningsQueryStart,
  filterTripsByPeriod,
  periodStarts,
  summarizeTrips,
} from "./earnings";

// Thursday, 12 November 2026, 15:00 local time. Monday of that week is the 9th.
const NOW = new Date(2026, 10, 12, 15, 0);

// A completed trip with the amounts of calculateFare, as the app saves it
const makeTrip = ({
  id,
  completedAt,
  paymentMethod = "cash",
  status = "paid",
  category = "economy",
  tip = 0,
}) => ({
  id,
  completedAt,
  paymentMethod,
  status,
  category,
  ...calculateFare({ distanceKm: 5, durationMin: 15, category, tip }),
});

const at = (...parts) => new Date(...parts);

describe("completedAtMillis", () => {
  it("reads a Firestore Timestamp, a Date or milliseconds", () => {
    const millis = NOW.getTime();
    expect(completedAtMillis({ completedAt: { toMillis: () => millis } })).toBe(
      millis,
    );
    expect(completedAtMillis({ completedAt: NOW })).toBe(millis);
    expect(completedAtMillis({ completedAt: millis })).toBe(millis);
  });

  it("returns null when the trip has no completedAt yet", () => {
    expect(completedAtMillis({ completedAt: null })).toBeNull();
    expect(completedAtMillis({})).toBeNull();
    expect(completedAtMillis(undefined)).toBeNull();
  });
});

describe("periodStarts", () => {
  it("starts the week on Monday and the month on day 1", () => {
    const starts = periodStarts(NOW);
    expect(starts.today).toBe(at(2026, 10, 12).getTime());
    expect(starts.week).toBe(at(2026, 10, 9).getTime());
    expect(starts.month).toBe(at(2026, 10, 1).getTime());
  });

  it("on Sunday the week still started on the previous Monday", () => {
    const sunday = at(2026, 10, 15, 10, 0);
    expect(periodStarts(sunday).week).toBe(at(2026, 10, 9).getTime());
  });

  it("on Monday the week starts today", () => {
    const monday = at(2026, 10, 9, 8, 0);
    expect(periodStarts(monday).week).toBe(at(2026, 10, 9).getTime());
  });

  it("a week can start in the previous month", () => {
    const sunday = at(2026, 10, 1, 9, 0);
    expect(periodStarts(sunday).week).toBe(at(2026, 9, 26).getTime());
    expect(periodStarts(sunday).month).toBe(at(2026, 10, 1).getTime());
  });
});

describe("filterTripsByPeriod", () => {
  const trips = [
    makeTrip({ id: "today", completedAt: at(2026, 10, 12, 0, 0) }),
    makeTrip({ id: "monday", completedAt: at(2026, 10, 9, 0, 0) }),
    makeTrip({ id: "lastSunday", completedAt: at(2026, 10, 8, 23, 59) }),
    makeTrip({ id: "firstOfMonth", completedAt: at(2026, 10, 1, 0, 0) }),
    makeTrip({ id: "lastMonth", completedAt: at(2026, 9, 31, 23, 59) }),
    makeTrip({ id: "pending", completedAt: null }),
  ];
  const ids = (period) =>
    filterTripsByPeriod(trips, period, NOW).map((trip) => trip.id);

  it("today only has trips since midnight", () => {
    expect(ids("today")).toEqual(["today"]);
  });

  it("the week starts on Monday at midnight", () => {
    expect(ids("week")).toEqual(["today", "monday"]);
  });

  it("the month starts on day 1 and leaves out the previous month", () => {
    expect(ids("month")).toEqual([
      "today",
      "monday",
      "lastSunday",
      "firstOfMonth",
    ]);
  });

  it("rejects an unknown period", () => {
    expect(() => filterTripsByPeriod(trips, "year", NOW)).toThrow();
  });
});

describe("summarizeTrips", () => {
  it("adds up fare, commission, tips and net earnings", () => {
    const first = makeTrip({ id: "a", completedAt: NOW, tip: 2000 });
    const second = makeTrip({ id: "b", completedAt: NOW, category: "premium" });
    const summary = summarizeTrips([first, second]);

    expect(summary).toEqual({
      tripCount: 2,
      totalFare: first.fare + second.fare,
      totalCommission: first.commission + second.commission,
      totalTips: 2000,
      netEarnings: first.driverEarnings + second.driverEarnings,
      averagePerTrip: Math.round(
        (first.driverEarnings + second.driverEarnings) / 2,
      ),
    });
    // Net earnings = fare - commission + tips, as calculateFare saved them
    expect(summary.netEarnings).toBe(
      summary.totalFare - summary.totalCommission + summary.totalTips,
    );
  });

  it("is all zeros without trips (no division by zero)", () => {
    expect(summarizeTrips([])).toEqual({
      tripCount: 0,
      totalFare: 0,
      totalCommission: 0,
      totalTips: 0,
      netEarnings: 0,
      averagePerTrip: 0,
    });
  });

  it("rounds the average to integer pesos", () => {
    const trips = [
      { fare: 0, commission: 0, tip: 0, driverEarnings: 1000 },
      { fare: 0, commission: 0, tip: 0, driverEarnings: 1001 },
    ];
    expect(summarizeTrips(trips).averagePerTrip).toBe(1001);
  });

  it("counts a missing amount as 0", () => {
    expect(summarizeTrips([{ fare: 8000 }]).netEarnings).toBe(0);
  });
});

describe("calculateBalance", () => {
  it("adds Mercado Pago earnings and subtracts cash commissions", () => {
    const card = makeTrip({
      id: "card",
      completedAt: NOW,
      paymentMethod: "mercadopago",
      tip: 1000,
    });
    const cash = makeTrip({ id: "cash", completedAt: NOW });
    expect(calculateBalance([card, cash])).toBe(
      card.driverEarnings - cash.commission,
    );
  });

  it("only counts Mercado Pago trips that are already paid", () => {
    const unpaid = makeTrip({
      id: "card",
      completedAt: NOW,
      paymentMethod: "mercadopago",
      status: "completed",
    });
    expect(calculateBalance([unpaid])).toBe(0);
  });

  it("is negative when the driver only had cash trips", () => {
    const cash = makeTrip({ id: "cash", completedAt: NOW });
    expect(calculateBalance([cash])).toBe(-cash.commission);
  });

  it("ignores other payment methods", () => {
    const stripe = makeTrip({
      id: "s",
      completedAt: NOW,
      paymentMethod: "stripe",
    });
    expect(calculateBalance([stripe])).toBe(0);
  });
});

describe("calculateEarnings", () => {
  it("returns the three periods and the balance", () => {
    const trips = [
      makeTrip({ id: "today", completedAt: at(2026, 10, 12, 9, 0) }),
      makeTrip({
        id: "week",
        completedAt: at(2026, 10, 10, 9, 0),
        paymentMethod: "mercadopago",
      }),
      makeTrip({ id: "month", completedAt: at(2026, 10, 3, 9, 0) }),
    ];
    const earnings = calculateEarnings(trips, NOW);

    expect(earnings.today.tripCount).toBe(1);
    expect(earnings.week.tripCount).toBe(2);
    expect(earnings.month.tripCount).toBe(3);
    expect(earnings.balance).toBe(
      trips[1].driverEarnings - trips[0].commission - trips[2].commission,
    );
  });

  it("the balance only counts this month, even if the week started before", () => {
    // Sunday 1 November: the week started on Monday 26 October
    const sunday = at(2026, 10, 1, 12, 0);
    const october = makeTrip({ id: "oct", completedAt: at(2026, 9, 30, 9, 0) });
    const november = makeTrip({ id: "nov", completedAt: at(2026, 10, 1, 9, 0) });
    const earnings = calculateEarnings([october, november], sunday);

    expect(earnings.week.tripCount).toBe(2);
    expect(earnings.month.tripCount).toBe(1);
    expect(earnings.balance).toBe(-november.commission);
  });
});

describe("earningsQueryStart", () => {
  it("is the start of the month when the week started this month", () => {
    expect(earningsQueryStart(NOW)).toBe(at(2026, 10, 1).getTime());
  });

  it("is the Monday when the week started in the previous month", () => {
    expect(earningsQueryStart(at(2026, 10, 1, 12, 0))).toBe(
      at(2026, 9, 26).getTime(),
    );
  });
});
