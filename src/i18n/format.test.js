// AI-assisted: see docs/AI_LOG.md #28
import { formatCop, formatDateTime, formatSignedCop } from "./format";

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
