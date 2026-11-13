// AI-assisted: see docs/AI_LOG.md #28, #31, #61
import {
  formatCop,
  formatDateTime,
  formatDay,
  formatDecimal,
  formatMonthYear,
  formatShortDate,
  formatSignedCop,
  formatTime,
} from "./format";

describe("formatCop", () => {
  it("shows integer pesos with dots for thousands", () => {
    expect(formatCop(12300)).toBe("$12.300 COP");
    expect(formatCop(0)).toBe("$0 COP");
  });

  it("treats a missing amount as 0", () => {
    expect(formatCop(undefined)).toBe("$0 COP");
  });
});

describe("formatSignedCop", () => {
  it("puts the minus sign before the dollar sign", () => {
    expect(formatSignedCop(-1200)).toBe("-$1.200 COP");
    expect(formatSignedCop(1200)).toBe("$1.200 COP");
  });
});

describe("formatDateTime", () => {
  it("is empty without a date", () => {
    expect(formatDateTime(null, "es")).toBe("");
  });

  it("includes the day of the month", () => {
    const millis = new Date(2026, 10, 12, 15, 5).getTime();
    expect(formatDateTime(millis, "es")).toContain("12");
    expect(formatDateTime(millis, "en")).toContain("12");
  });
});

describe("formatDecimal", () => {
  it("uses a comma in Spanish and a dot in English, with one decimal", () => {
    expect(formatDecimal(2.44, "es")).toBe("2,4");
    expect(formatDecimal(2.44, "en")).toBe("2.4");
    expect(formatDecimal(3, "es")).toBe("3");
  });
});

// AI-assisted: see docs/AI_LOG.md #60
describe("formatDay and formatTime", () => {
  const millis = new Date(2026, 10, 12, 15, 5).getTime();

  it("shows the weekday, day and month of the history headers", () => {
    expect(formatDay(millis, "en")).toMatch(/Thu.*Nov.*12|Thu.*12.*Nov/);
  });

  it("shows the hour and minutes of a trip", () => {
    expect(formatTime(millis, "en")).toMatch(/3:05/);
    expect(formatTime(null, "en")).toBe("");
  });
});

// AI-assisted: see docs/AI_LOG.md #61
describe("formatShortDate and formatMonthYear", () => {
  const millis = new Date(2026, 10, 9, 10, 0).getTime();

  it("shows the day and month of the week navigator", () => {
    expect(formatShortDate(millis, "en")).toMatch(/Nov.*9|9.*Nov/);
  });

  it("shows the month and year of member since", () => {
    expect(formatMonthYear(millis, "en")).toMatch(/Nov.*2026/);
    expect(formatMonthYear(null, "en")).toBe("");
  });
});
