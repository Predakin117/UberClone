import { KNOWN_VERIFICATION_ERRORS } from "../services/verificationErrors";
import { DOCUMENT_FIELDS, validateDocuments } from "../validation/documents";
import { validatePersonalInfo } from "../validation/personalInfo";
import { strings, translate } from "./strings";

// Vehículo de 2018: con la fecha fija necesita revisión técnico-mecánica
const TODAY = new Date(2026, 10, 5);
const emptyDocuments = {
  ...Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, ""])),
  year: "2018",
  acceptedTerms: false,
};
const invalidDocuments = {
  ...emptyDocuments,
  licenseNumber: "12A",
  licenseExpiry: "2026-11-05",
  soatExpiry: "2026-01-01",
  techReviewExpiry: "2027-02-30",
  mercadoPagoEmail: "ana@",
};

const emptyPersonalInfo = {
  profilePhoto: "",
  name: "",
  documentId: "",
  phone: "",
  birthDate: "",
  gender: "",
  email: "",
  language: "",
};

// Datos con un error distinto de "obligatorio" en cada campo que lo admite
const invalidPersonalInfo = {
  ...emptyPersonalInfo,
  name: "Ana 2",
  documentId: "123",
  phone: "123",
  birthDate: "2025-02-30",
  email: "ana@",
};

describe("strings", () => {
  it("tiene las mismas claves en español y en inglés", () => {
    expect(Object.keys(strings.en).sort()).toEqual(
      Object.keys(strings.es).sort(),
    );
  });

  it("traduce cada error de la pestaña 1 en los dos idiomas", () => {
    const codes = [
      ...Object.values(validatePersonalInfo(emptyPersonalInfo)),
      ...Object.values(validatePersonalInfo(invalidPersonalInfo)),
    ];
    for (const code of codes) {
      expect(strings.es[code]).toBeDefined();
      expect(strings.en[code]).toBeDefined();
    }
  });

  it("traduce cada error de la pestaña 3 en los dos idiomas", () => {
    const codes = [
      ...Object.values(validateDocuments(emptyDocuments, TODAY)),
      ...Object.values(validateDocuments(invalidDocuments, TODAY)),
    ];
    expect(codes).toContain("errors.techReviewExpiryRequired");
    expect(codes).toContain("errors.expiryInvalid");
    for (const code of codes) {
      expect(strings.es[code]).toBeDefined();
      expect(strings.en[code]).toBeDefined();
    }
  });

  it("traduce cada error del código de verificación en los dos idiomas", () => {
    for (const code of [...KNOWN_VERIFICATION_ERRORS, "generico"]) {
      expect(strings.es[`verify.error.${code}`]).toBeDefined();
      expect(strings.en[`verify.error.${code}`]).toBeDefined();
    }
  });

  it("traduce según el idioma", () => {
    expect(translate("es", "common.next")).toBe("Siguiente");
    expect(translate("en", "common.next")).toBe("Next");
  });

  it("devuelve el texto tal cual si no es una clave conocida", () => {
    expect(translate("en", "La placa es obligatoria")).toBe(
      "La placa es obligatoria",
    );
    expect(translate("en", undefined)).toBeUndefined();
  });
});
