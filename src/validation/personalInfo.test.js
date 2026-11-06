import { validatePersonalInfo } from "./personalInfo";

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
      expect(errorsFor({ name: "A".repeat(50) }).name).toBeUndefined();
      expect(errorsFor({ name: "A".repeat(51) }).name).toBeDefined();
    });
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
