// AI-assisted: see docs/AI_LOG.md #61
import { calculateFare } from "../config/pricing";
import {
  MAX_WEEKS_BACK,
  earningsSince,
  weekEarnings,
  weekStart,
} from "./earningsWeeks";

// Thursday, 12 November 2026, 15:00 local time. Monday of that week is the 9th.
const NOW = new Date(2026, 10, 12, 15, 0);
const at = (...parts) => new Date(...parts).getTime();

const makeTrip = (id, completedAt) => ({
  id,
  completedAt,
  status: "paid",
  paymentMethod: "cash",
  ...calculateFare({ distanceKm: 5, durationMin: 15, category: "economy" }),
});

describe("weekStart", () => {
  it("is this Monday, and goes back 7 days per week", () => {
    expect(weekStart(0, NOW)).toBe(at(2026, 10, 9));
    expect(weekStart(1, NOW)).toBe(at(2026, 10, 2));
    expect(weekStart(2, NOW)).toBe(at(2026, 9, 26));
  });
});

describe("earningsSince", () => {
  it("is the start of the month while the week is in this month", () => {
    expect(earningsSince(0, NOW)).toBe(at(2026, 10, 1));
  });

  it("is the start of an older week when the driver goes back", () => {
    expect(earningsSince(2, NOW)).toBe(at(2026, 9, 26));
    expect(earningsSince(MAX_WEEKS_BACK, NOW)).toBe(weekStart(11, NOW));
  });
});

describe("weekEarnings", () => {
  const trips = [
    makeTrip("mon", at(2026, 10, 9, 0, 0)),
    makeTrip("thu1", at(2026, 10, 12, 8, 0)),
    makeTrip("thu2", at(2026, 10, 12, 14, 0)),
    makeTrip("lastSun", at(2026, 10, 8, 23, 59)),
    makeTrip("pending", null),
  ];
  const net = makeTrip("x", 0).driverEarnings;

  it("adds up each day of this week, Monday to Sunday", () => {
    const week = weekEarnings(trips, 0, NOW);
    expect(week.start).toBe(at(2026, 10, 9));
    expect(week.end).toBe(at(2026, 10, 16));
    expect(week.total.tripCount).toBe(3);
    expect(week.total.netEarnings).toBe(3 * net);
    expect(week.days.map((day) => day.tripCount)).toEqual([
      1, 0, 0, 2, 0, 0, 0,
    ]);
    expect(week.days[3]).toMatchObject({
      day: "thu",
      start: at(2026, 10, 12),
      netEarnings: 2 * net,
      isToday: true,
    });
    expect(week.days.filter((day) => day.isToday)).toHaveLength(1);
  });

  it("shows last week without a today", () => {
    const week = weekEarnings(trips, 1, NOW);
    expect(week.total.tripCount).toBe(1);
    expect(week.days[6]).toMatchObject({ day: "sun", tripCount: 1 });
    expect(week.days.some((day) => day.isToday)).toBe(false);
  });

  it("an empty week has zeros", () => {
    const week = weekEarnings([], 3, NOW);
    expect(week.total.netEarnings).toBe(0);
    expect(week.days.every((day) => day.netEarnings === 0)).toBe(true);
  });
});
