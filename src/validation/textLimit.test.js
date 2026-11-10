// AI-assisted: see docs/AI_LOG.md #54
import { strings } from "../i18n/strings";
import { limitStatus } from "./textLimit";

describe("limitStatus", () => {
  it("says nothing while the text is short or there's no limit", () => {
    expect(limitStatus(0, 50)).toBe("none");
    expect(limitStatus(39, 50)).toBe("none");
    expect(limitStatus(500, undefined)).toBe("none");
  });

  it("shows the counter from 80 % of the limit", () => {
    expect(limitStatus(40, 50)).toBe("near");
    expect(limitStatus(49, 50)).toBe("near");
  });

  it("warns when the limit is reached", () => {
    expect(limitStatus(50, 50)).toBe("reached");
  });

  it("has the warning texts in both languages", () => {
    for (const key of ["form.charCount", "form.maxLengthReached"]) {
      expect(strings.es[key]).toContain("{max}");
      expect(strings.en[key]).toContain("{max}");
    }
  });
});
