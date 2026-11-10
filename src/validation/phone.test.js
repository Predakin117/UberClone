// AI-assisted: see docs/AI_LOG.md #52
import { strings } from "../i18n/strings";
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  findCountry,
  normalizePhone,
  toInternationalPhone,
  validateLoginPhone,
} from "./phone";

const errorsFor = (phone, countryCode = "CO") =>
  validateLoginPhone({ countryCode, phone });

describe("COUNTRIES", () => {
  it("has no duplicate countries and defaults to Colombia", () => {
    const codes = COUNTRIES.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(findCountry(DEFAULT_COUNTRY_CODE).dialCode).toBe("+57");
  });

  it("has every country name in Spanish and English", () => {
    for (const country of COUNTRIES) {
      expect(country.name.es).toBeTruthy();
      expect(country.name.en).toBeTruthy();
    }
  });
});

describe("validateLoginPhone", () => {
  it("accepts a 10-digit Colombian mobile number", () => {
    expect(errorsFor("3001234567")).toEqual({});
  });

  it("ignores spaces, hyphens and parentheses", () => {
    expect(normalizePhone("(300) 123-4567")).toBe("3001234567");
    expect(errorsFor("300 123 4567")).toEqual({});
  });

  it("requires the number", () => {
    expect(errorsFor("").phone).toBe("errors.loginPhoneRequired");
    expect(errorsFor("   ").phone).toBe("errors.loginPhoneRequired");
  });

  it("rejects letters and other symbols", () => {
    expect(errorsFor("300abc4567").phone).toBe("errors.loginPhoneInvalid");
    expect(errorsFor("+573001234567").phone).toBe("errors.loginPhoneInvalid");
  });

  it("uses the digit count of the selected country", () => {
    expect(errorsFor("300123456").phone).toBe("errors.loginPhoneLength");
    expect(errorsFor("30012345678").phone).toBe("errors.loginPhoneLength");
    expect(errorsFor("612345678", "ES")).toEqual({});
    expect(errorsFor("61234567", "PA")).toEqual({});
    expect(errorsFor("3001234567", "PA").phone).toBe("errors.loginPhoneLength");
  });

  it("accepts Argentina with 10 or 11 digits", () => {
    expect(errorsFor("1123456789", "AR")).toEqual({});
    expect(errorsFor("91123456789", "AR")).toEqual({});
  });

  it("requires a country from the list", () => {
    expect(errorsFor("3001234567", "XX").countryCode).toBe(
      "errors.countryRequired",
    );
  });
});

describe("toInternationalPhone", () => {
  it("joins the country code and the number", () => {
    expect(toInternationalPhone("CO", "300 123 4567")).toBe("+573001234567");
    expect(toInternationalPhone("ES", "612345678")).toBe("+34612345678");
  });
});

describe("login texts", () => {
  it("translates every error in both languages", () => {
    const codes = [
      errorsFor("").phone,
      errorsFor("abc").phone,
      errorsFor("123").phone,
      errorsFor("3001234567", "XX").countryCode,
    ];
    for (const code of codes) {
      expect(strings.es[code]).toBeDefined();
      expect(strings.en[code]).toBeDefined();
    }
  });
});
