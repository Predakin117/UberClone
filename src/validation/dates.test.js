import {
  formatDisplayDate,
  getAge,
  parseISODate,
  toISODate,
  yearsAgo,
} from "./dates";

describe("dates", () => {
  it("convierte entre Date y AAAA-MM-DD en hora local", () => {
    const date = new Date(1995, 3, 20);
    expect(toISODate(date)).toBe("1995-04-20");
    expect(parseISODate("1995-04-20")).toEqual(date);
  });

  it("devuelve null para fechas que no existen", () => {
    expect(parseISODate("2025-02-29")).toBeNull();
    expect(parseISODate("")).toBeNull();
  });

  it("muestra la fecha como DD/MM/AAAA", () => {
    expect(formatDisplayDate("1995-04-20")).toBe("20/04/1995");
  });

  it("calcula la edad según si ya pasó el cumpleaños", () => {
    const today = new Date(2026, 10, 5);
    expect(getAge(new Date(2008, 10, 5), today)).toBe(18);
    expect(getAge(new Date(2008, 10, 6), today)).toBe(17);
  });

  it("resta años sin pasarse de mes en un 29 de febrero", () => {
    expect(toISODate(yearsAgo(18, new Date(2028, 1, 29)))).toBe("2010-02-28");
    expect(toISODate(yearsAgo(18, new Date(2026, 10, 5)))).toBe("2008-11-05");
  });
});
