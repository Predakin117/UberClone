import {
  isOnlyProfilePhotoMissing,
  validatePersonalInfo,
} from "./personalInfo";

// Fecha fija para que las pruebas de edad no dependan del día en que se corren
const TODAY = new Date(2026, 10, 5); // 5 de noviembre de 2026

const validData = {
  profilePhoto: "file:///foto.jpg",
  name: "Ana María Pérez",
  documentId: "1234567890",
  phone: "3001234567",
  birthDate: "1995-04-20",
  gender: "female",
  email: "ana@ejemplo.com",
  language: "es",
};

const errorsFor = (changes) =>
  validatePersonalInfo({ ...validData, ...changes }, TODAY);

describe("validatePersonalInfo", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validatePersonalInfo(validData, TODAY)).toEqual({});
  });

  it("marca como obligatorios todos los campos vacíos", () => {
    const empty = Object.fromEntries(
      Object.keys(validData).map((field) => [field, ""]),
    );
    expect(Object.keys(validatePersonalInfo(empty, TODAY)).sort()).toEqual(
      Object.keys(validData).sort(),
    );
  });

  it("devuelve claves de traducción como errores", () => {
    expect(errorsFor({ profilePhoto: "" }).profilePhoto).toBe(
      "errors.profilePhotoRequired",
    );
    expect(errorsFor({ name: "A".repeat(51) }).name).toBe("errors.nameTooLong");
    expect(errorsFor({ birthDate: "2010-01-01" }).birthDate).toBe(
      "errors.birthDateUnderage",
    );
  });

  describe("nombre", () => {
    it("acepta tildes, ñ y espacios", () => {
      expect(errorsFor({ name: "José Ñuñez Güiza" }).name).toBeUndefined();
    });

    it("rechaza números y símbolos", () => {
      for (const name of ["Ana 2", "Ana_Pérez", "Ana-María", "Ana."]) {
        expect(errorsFor({ name }).name).toBeDefined();
      }
    });

    it("rechaza el nombre vacío o solo con espacios", () => {
      expect(errorsFor({ name: "   " }).name).toBeDefined();
    });

    it("admite máximo 50 caracteres", () => {
      // AI-assisted: see docs/AI_LOG.md #54 (two words, so it's a full name)
      expect(errorsFor({ name: `Ana ${"B".repeat(46)}` }).name).toBeUndefined();
      expect(errorsFor({ name: "A".repeat(51) }).name).toBeDefined();
    });

    // AI-assisted: see docs/AI_LOG.md #54
    it("requires the first and last name", () => {
      for (const name of ["Ana", "Ana P", "A B"]) {
        expect(errorsFor({ name }).name).toBe("errors.nameIncomplete");
      }
      expect(errorsFor({ name: "Ana de la Cruz" }).name).toBeUndefined();
    });
  });

  // AI-assisted: see docs/AI_LOG.md #54
  it("rejects ID numbers that start with 0 or repeat one digit", () => {
    expect(errorsFor({ documentId: "0123456" }).documentId).toBe(
      "errors.documentIdInvalid",
    );
    expect(errorsFor({ documentId: "1111111" }).documentId).toBe(
      "errors.documentIdRepeated",
    );
  });

  // AI-assisted: see docs/AI_LOG.md #54
  it("accepts a Colombian mobile or the international number of the account", () => {
    for (const phone of ["3001234567", "+573001234567", "+5491123456789"]) {
      expect(errorsFor({ phone }).phone).toBeUndefined();
    }
    for (const phone of ["6011234567", "+57", "+0573001234567"]) {
      expect(errorsFor({ phone }).phone).toBe("errors.phoneInvalid");
    }
  });

  // AI-assisted: see docs/AI_LOG.md #54
  it("rejects badly written emails", () => {
    for (const email of [
      "ana..perez@ejemplo.com",
      ".ana@ejemplo.com",
      "ana.@ejemplo.com",
      "ana@ejemplo.c",
      "ana@-ejemplo.com",
      "ana@ejemplo..com",
      "ana@ejemplo.com.",
      "ana,perez@ejemplo.com",
      `${"a".repeat(95)}@x.com`,
    ]) {
      expect(errorsFor({ email }).email).toBe("errors.emailInvalid");
    }
    for (const email of ["ana.perez+uber@mail.ejemplo.co", "ANA_01@Ejemplo.com"]) {
      expect(errorsFor({ email }).email).toBeUndefined();
    }
  });

  it("exige un documento numérico de 6 a 10 dígitos", () => {
    for (const documentId of ["123456", "1234567890"]) {
      expect(errorsFor({ documentId }).documentId).toBeUndefined();
    }
    for (const documentId of ["12345", "12345678901", "12a456", "123 456"]) {
      expect(errorsFor({ documentId }).documentId).toBeDefined();
    }
  });

  it("exige un celular numérico de 10 dígitos", () => {
    for (const phone of [
      "300123456",
      "30012345678",
      "300-123456",
      "300123456a",
    ]) {
      expect(errorsFor({ phone }).phone).toBeDefined();
    }
  });

  describe("fecha de nacimiento", () => {
    it("acepta a quien cumple 18 años hoy", () => {
      expect(errorsFor({ birthDate: "2008-11-05" }).birthDate).toBeUndefined();
    });

    it("rechaza a quien cumple 18 años mañana", () => {
      expect(errorsFor({ birthDate: "2008-11-06" }).birthDate).toBeDefined();
    });

    it("rechaza fechas inexistentes o mal escritas", () => {
      for (const birthDate of ["1995-02-30", "20/04/1995", "1995-4-20"]) {
        expect(errorsFor({ birthDate }).birthDate).toBeDefined();
      }
    });
  });

  it("exige un género de la lista", () => {
    expect(errorsFor({ gender: "otro" }).gender).toBeDefined();
  });

  it("exige un correo con @ y dominio", () => {
    for (const email of [
      "ana",
      "ana@",
      "ana@ejemplo",
      "@ejemplo.com",
      "ana @ejemplo.com",
    ]) {
      expect(errorsFor({ email }).email).toBeDefined();
    }
  });

  it("exige español o inglés como idioma", () => {
    expect(errorsFor({ language: "en" }).language).toBeUndefined();
    expect(errorsFor({ language: "fr" }).language).toBeDefined();
  });
});

// AI-assisted: see docs/AI_LOG.md #58
describe("isOnlyProfilePhotoMissing", () => {
  it("is true when the photo is the only empty field", () => {
    expect(
      isOnlyProfilePhotoMissing({ ...validData, profilePhoto: "" }, TODAY),
    ).toBe(true);
  });

  it("is false when the tab is complete", () => {
    expect(isOnlyProfilePhotoMissing(validData, TODAY)).toBe(false);
  });

  it("is false when other fields also have errors", () => {
    expect(
      isOnlyProfilePhotoMissing(
        { ...validData, profilePhoto: "", name: "" },
        TODAY,
      ),
    ).toBe(false);
  });

  it("is false when the photo is there but another field fails", () => {
    expect(isOnlyProfilePhotoMissing({ ...validData, email: "ana" }, TODAY)).toBe(
      false,
    );
  });
});
