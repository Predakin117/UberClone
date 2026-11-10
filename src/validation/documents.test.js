import {
  DOCUMENT_FIELDS,
  requiresTechReview,
  validateDocuments,
} from "./documents";

// Fecha fija para que los vencimientos no dependan del día en que se corren
const TODAY = new Date(2026, 10, 5); // 5 de noviembre de 2026

const validData = {
  year: "2018", // 8 años: necesita revisión técnico-mecánica
  licenseNumber: "1234567890",
  licensePhoto: "file:///licencia.jpg",
  licenseExpiry: "2030-01-15",
  soatPhoto: "file:///soat.jpg",
  soatExpiry: "2027-03-01",
  techReviewPhoto: "file:///rtm.jpg",
  techReviewExpiry: "2027-06-30",
  mercadoPagoEmail: "ana@ejemplo.com",
  acceptedTerms: true,
};

const errorsFor = (changes) =>
  validateDocuments({ ...validData, ...changes }, TODAY);

describe("validateDocuments", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validateDocuments(validData, TODAY)).toEqual({});
  });

  it("marca como obligatorios todos los campos vacíos", () => {
    const empty = {
      ...Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, ""])),
      year: "2018",
      acceptedTerms: false,
    };
    expect(Object.keys(validateDocuments(empty, TODAY)).sort()).toEqual(
      [...DOCUMENT_FIELDS].sort(),
    );
  });

  it("exige que el número de licencia tenga solo dígitos", () => {
    expect(errorsFor({ licenseNumber: "12A456" }).licenseNumber).toBe(
      "errors.licenseNumberInvalid",
    );
    expect(errorsFor({ licenseNumber: "   " }).licenseNumber).toBe(
      "errors.licenseNumberRequired",
    );
  });

  // AI-assisted: see docs/AI_LOG.md #54
  it("requires a license number of 6 to 15 digits", () => {
    expect(errorsFor({ licenseNumber: "123456" }).licenseNumber).toBeUndefined();
    for (const licenseNumber of ["12345", "1".repeat(16)]) {
      expect(errorsFor({ licenseNumber }).licenseNumber).toBe(
        "errors.licenseNumberLength",
      );
    }
  });

  // AI-assisted: see docs/AI_LOG.md #54
  it("rejects expiration dates later than each document can last", () => {
    // License: up to 10 years. SOAT and inspection: up to 1 year.
    expect(errorsFor({ licenseExpiry: "2036-11-05" }).licenseExpiry).toBeUndefined();
    expect(errorsFor({ licenseExpiry: "2036-11-06" }).licenseExpiry).toBe(
      "errors.expiryTooFar",
    );
    expect(errorsFor({ soatExpiry: "2027-11-05" }).soatExpiry).toBeUndefined();
    expect(errorsFor({ soatExpiry: "2027-11-06" }).soatExpiry).toBe(
      "errors.expiryTooFar",
    );
    expect(errorsFor({ techReviewExpiry: "2028-01-01" }).techReviewExpiry).toBe(
      "errors.expiryTooFar",
    );
  });

  describe("vencimientos", () => {
    it("acepta una fecha desde mañana", () => {
      expect(errorsFor({ soatExpiry: "2026-11-06" }).soatExpiry).toBeUndefined();
    });

    it("rechaza hoy y las fechas pasadas", () => {
      expect(errorsFor({ licenseExpiry: "2026-11-05" }).licenseExpiry).toBe(
        "errors.licenseExpired",
      );
      expect(errorsFor({ soatExpiry: "2025-12-31" }).soatExpiry).toBe(
        "errors.soatExpired",
      );
      expect(
        errorsFor({ techReviewExpiry: "2026-01-01" }).techReviewExpiry,
      ).toBe("errors.techReviewExpired");
    });

    it("rechaza fechas inexistentes o mal escritas", () => {
      for (const licenseExpiry of ["2027-02-30", "15/01/2030"]) {
        expect(errorsFor({ licenseExpiry }).licenseExpiry).toBe(
          "errors.expiryInvalid",
        );
      }
    });
  });

  describe("revisión técnico-mecánica", () => {
    it("se exige desde el quinto año del vehículo", () => {
      expect(requiresTechReview("2021", TODAY)).toBe(true);
      expect(requiresTechReview("2022", TODAY)).toBe(false);
    });

    it("no se exige si el año del vehículo todavía no es válido", () => {
      expect(requiresTechReview("", TODAY)).toBe(false);
      expect(requiresTechReview("20a1", TODAY)).toBe(false);
    });

    it("no pide foto ni fecha a un vehículo nuevo", () => {
      const errors = errorsFor({
        year: "2024",
        techReviewPhoto: "",
        techReviewExpiry: "",
      });
      expect(errors).toEqual({});
    });
  });

  it("valida el formato del correo de Mercado Pago", () => {
    expect(errorsFor({ mercadoPagoEmail: "ana@" }).mercadoPagoEmail).toBe(
      "errors.mercadoPagoEmailInvalid",
    );
  });

  it("exige aceptar los términos", () => {
    expect(errorsFor({ acceptedTerms: false }).acceptedTerms).toBe(
      "errors.termsRequired",
    );
  });
});
