// AI-assisted: see docs/AI_LOG.md #31
import { nextHeading } from "./carHeading";

describe("nextHeading", () => {
  it("follows the GPS heading while the car moves", () => {
    expect(nextHeading(0, { heading: 90, speed: 8 })).toBe(90);
    expect(nextHeading(90, { heading: 360, speed: 8 })).toBe(0);
  });

  it("keeps the last direction when standing still (Android reports 0)", () => {
    expect(nextHeading(135, { heading: 0, speed: 0 })).toBe(135);
  });

  it("keeps the last direction when the heading is unknown (iOS reports -1)", () => {
    expect(nextHeading(200, { heading: -1, speed: 5 })).toBe(200);
    expect(nextHeading(200, { heading: null, speed: null })).toBe(200);
    expect(nextHeading(200)).toBe(200);
  });

  it("starts pointing north without any previous heading", () => {
    expect(nextHeading(undefined, { heading: 0, speed: 0 })).toBe(0);
  });
});
