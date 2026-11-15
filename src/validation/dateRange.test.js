// AI-assisted: see docs/AI_LOG.md #60
import { validateDateRange } from "./dateRange";

describe("validateDateRange", () => {
  it("accepts a range of several days or a single day", () => {
    expect(validateDateRange({ from: "2026-11-01", to: "2026-11-12" })).toEqual(
      {},
    );
    expect(validateDateRange({ from: "2026-11-12", to: "2026-11-12" })).toEqual(
      {},
    );
  });

  it("rejects a start after the end, under the end date", () => {
    expect(validateDateRange({ from: "2026-11-12", to: "2026-11-01" })).toEqual(
      { to: "errors.dateRangeOrder" },
    );
  });

  it("asks for both dates", () => {
    expect(validateDateRange({ from: "", to: "2026-02-30" })).toEqual({
      from: "errors.dateRangeRequired",
      to: "errors.dateRangeRequired",
    });
  });
});
