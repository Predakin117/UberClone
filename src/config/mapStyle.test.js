// AI-assisted: see docs/AI_LOG.md #31, #64
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE, isNightTime } from "./mapStyle";

const at = (hour, minute = 0) => new Date(2026, 10, 12, hour, minute);

describe("isNightTime", () => {
  it("is night from 6 p.m.", () => {
    expect(isNightTime(at(17, 59))).toBe(false);
    expect(isNightTime(at(18, 0))).toBe(true);
    expect(isNightTime(at(23, 59))).toBe(true);
  });

  it("is night until 6 a.m.", () => {
    expect(isNightTime(at(0, 0))).toBe(true);
    expect(isNightTime(at(5, 59))).toBe(true);
    expect(isNightTime(at(6, 0))).toBe(false);
    expect(isNightTime(at(12, 0))).toBe(false);
  });
});

describe("DARK_MAP_STYLE", () => {
  it("is a Google Maps style: a list of stylers with colors", () => {
    expect(DARK_MAP_STYLE.length).toBeGreaterThan(0);
    for (const rule of DARK_MAP_STYLE) {
      expect(rule.stylers[0].color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("LIGHT_MAP_STYLE", () => {
  it("is a Google Maps style: each rule has a color or hides something", () => {
    expect(LIGHT_MAP_STYLE.length).toBeGreaterThan(0);
    for (const rule of LIGHT_MAP_STYLE) {
      const [styler] = rule.stylers;
      if (styler.color) expect(styler.color).toMatch(/^#[0-9a-f]{6}$/);
      else expect(styler.visibility).toBe("off");
    }
  });
});
