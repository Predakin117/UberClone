import { validatePersonalInfo } from "../validation/personalInfo";
import { strings, translate } from "./strings";

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
