import { validatePersonalInfo } from "./personalInfo";

const validData = { name: "Ana Pérez", email: "ana@ejemplo.com" };

describe("validatePersonalInfo", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validatePersonalInfo(validData)).toEqual({});
  });

  it("exige el nombre", () => {
    expect(validatePersonalInfo({ ...validData, name: "   " }).name).toBeDefined();
  });

  it("exige un correo con @ y dominio", () => {
    for (const email of ["", "ana", "ana@", "ana@ejemplo"]) {
      expect(validatePersonalInfo({ ...validData, email }).email).toBeDefined();
    }
  });
});
