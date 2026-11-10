import { describeVerificationError, isValidCode } from "./verificationErrors";

describe("verificationErrors", () => {
  it("acepta solo códigos de 6 dígitos", () => {
    expect(isValidCode("012345")).toBe(true);
    expect(isValidCode(" 012345 ")).toBe(true);
    for (const code of ["", "12345", "1234567", "12a456"]) {
      expect(isValidCode(code)).toBe(false);
    }
  });

  it("usa la clave del error y los datos que manda el backend", () => {
    expect(
      describeVerificationError({
        ok: false,
        codigoError: "codigo_incorrecto",
        intentosRestantes: 3,
      }),
    ).toEqual({
      key: "verify.error.codigo_incorrecto",
      values: { seconds: 60, attempts: 3 },
    });
    expect(
      describeVerificationError({ codigoError: "espera", reintentarEn: 42 })
        .values.seconds,
    ).toBe(42);
  });

  it("usa el mensaje genérico para errores desconocidos", () => {
    expect(describeVerificationError({ codigoError: "otro" }).key).toBe(
      "verify.error.generico",
    );
    expect(describeVerificationError(undefined).key).toBe(
      "verify.error.generico",
    );
  });
});
