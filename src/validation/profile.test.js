// AI-assisted: see docs/AI_LOG.md #30
import { validateDocuments } from "./documents";
import { validatePersonalInfo } from "./personalInfo";
import { validateProfile } from "./profile";

const valid = {
  profilePhoto: "https://res.cloudinary.com/demo/foto.jpg",
  name: "Tamiro Solano",
  mercadoPagoEmail: "pagos@ejemplo.com",
};

describe("validateProfile", () => {
  it("accepts a valid photo, full name and email", () => {
    expect(validateProfile(valid)).toEqual({});
  });

  it("requires the profile photo", () => {
    expect(validateProfile({ ...valid, profilePhoto: "" })).toEqual({
      profilePhoto: "errors.profilePhotoRequired",
    });
  });

  it("uses the same name rules as tab 1", () => {
    for (const name of ["", "Tamiro", "Tamiro 2", "a".repeat(51)]) {
      const fromRegistration = validatePersonalInfo({
        profilePhoto: "x",
        name,
        documentId: "",
        phone: "",
        birthDate: "",
        gender: "",
        email: "",
        language: "",
      }).name;
      expect(validateProfile({ ...valid, name }).name).toBe(fromRegistration);
    }
  });

  it("uses the same Mercado Pago email rules as tab 3", () => {
    for (const mercadoPagoEmail of ["", "pagos@", "pagos@ejemplo"]) {
      const fromRegistration = validateDocuments({
        licenseNumber: "",
        licensePhoto: "",
        licenseExpiry: "",
        soatPhoto: "",
        soatExpiry: "",
        year: "",
        techReviewPhoto: "",
        techReviewExpiry: "",
        mercadoPagoEmail,
        acceptedTerms: false,
      }).mercadoPagoEmail;
      expect(validateProfile({ ...valid, mercadoPagoEmail }).mercadoPagoEmail)
        .toBe(fromRegistration);
      expect(fromRegistration).toBeDefined();
    }
  });
});
