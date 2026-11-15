// AI-assisted: see docs/AI_LOG.md #60
import {
  filterTripsByDateRange,
  filterTripsByPaymentMethod,
  groupTripsByDay,
  HISTORY_PERIODS,
  PAYMENT_FILTERS,
  relativeDay,
} from "./historyFilters";

// Local time, like the app: November 12, 2026 at the given hour
const at = (day, hour = 12) => new Date(2026, 10, day, hour).getTime();
const trip = (id, day, hour, paymentMethod = "cash") => ({
  id,
  completedAt: at(day, hour),
  paymentMethod,
});

describe("history filters", () => {
  it("offers the three periods plus a custom range", () => {
    expect(HISTORY_PERIODS).toEqual(["today", "week", "month", "range"]);
    expect(PAYMENT_FILTERS).toEqual(["all", "mercadopago", "stripe", "cash"]);
  });
});

describe("filterTripsByDateRange", () => {
  const trips = [
    trip("late", 12, 23),
    trip("first", 10, 0),
    trip("before", 9, 23),
    trip("after", 13, 0),
  ];

  it("includes the whole first and last day", () => {
    const ids = filterTripsByDateRange(trips, "2026-11-10", "2026-11-12").map(
      (item) => item.id,
    );
    expect(ids).toEqual(["late", "first"]);
  });

  it("works with a single day", () => {
    const ids = filterTripsByDateRange(trips, "2026-11-13", "2026-11-13").map(
      (item) => item.id,
    );
    expect(ids).toEqual(["after"]);
  });

  it("returns nothing with an invalid date or trips without completedAt", () => {
    expect(filterTripsByDateRange(trips, "", "2026-11-12")).toEqual([]);
    expect(
      filterTripsByDateRange([{ id: "x" }], "2026-11-01", "2026-11-30"),
    ).toEqual([]);
  });
});

describe("filterTripsByPaymentMethod", () => {
  const trips = [trip("a", 12, 9, "cash"), trip("b", 12, 10, "mercadopago")];

  it("keeps every trip with 'all'", () => {
    expect(filterTripsByPaymentMethod(trips, "all")).toBe(trips);
  });

  it("keeps only the chosen method", () => {
    expect(filterTripsByPaymentMethod(trips, "mercadopago")).toEqual([
      trips[1],
    ]);
  });
});

describe("groupTripsByDay", () => {
  it("groups consecutive trips of the same day, newest day first", () => {
    const trips = [
      trip("a", 12, 18),
      trip("b", 12, 8),
      trip("c", 10, 20),
      { id: "no-date" },
    ];
    const days = groupTripsByDay(trips);
    expect(days.map((day) => day.trips.map((item) => item.id))).toEqual([
      ["a", "b"],
      ["c"],
    ]);
    expect(days[0].dayStart).toBe(new Date(2026, 10, 12).getTime());
  });
});

describe("relativeDay", () => {
  const now = new Date(2026, 10, 12, 15);

  it("names today and yesterday", () => {
    expect(relativeDay(new Date(2026, 10, 12).getTime(), now)).toBe("today");
    expect(relativeDay(new Date(2026, 10, 11).getTime(), now)).toBe(
      "yesterday",
    );
  });

  it("returns null for older days", () => {
    expect(relativeDay(new Date(2026, 10, 1).getTime(), now)).toBeNull();
  });
});
