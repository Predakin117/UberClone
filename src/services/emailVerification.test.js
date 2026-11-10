jest.mock("../config/env", () => ({
  env: { backendApiUrl: "http://192.168.0.10:3000/api/v1" },
}));
jest.mock("expo-device", () => ({ manufacturer: "Google", modelName: "Pixel 7" }));

import { enviarCodigo, verificarCodigo } from "./emailVerification";

const respuesta = (status, body) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

describe("emailVerification", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("pide el código al backend con el motivo y el dispositivo", async () => {
    global.fetch.mockReturnValue(respuesta(200, { ok: true, minutos: 10 }));

    const res = await enviarCodigo({ email: " ana@ejemplo.com ", nombre: "Ana", motivo: "login" });

    expect(res).toEqual({ ok: true, minutos: 10 });
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe("http://192.168.0.10:3000/api/v1/auth/enviar-codigo");
    expect(JSON.parse(opciones.body)).toEqual({
      email: "ana@ejemplo.com",
      nombre: "Ana",
      motivo: "login",
      dispositivo: "Google Pixel 7",
    });
  });

  it("verifica el código", async () => {
    global.fetch.mockReturnValue(respuesta(200, { ok: true }));
    const res = await verificarCodigo({ email: "ana@ejemplo.com", codigo: 123456 });
    expect(res).toEqual({ ok: true });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).codigo).toBe("123456");
  });

  it("devuelve el error del backend sin lanzar", async () => {
    global.fetch.mockReturnValue(
      respuesta(400, { ok: false, codigoError: "codigo_incorrecto", error: "El código es incorrecto" }),
    );
    const res = await verificarCodigo({ email: "a@b.co", codigo: "000000" });
    expect(res).toEqual({ ok: false, codigoError: "codigo_incorrecto", error: "El código es incorrecto" });
  });

  it("avisa cuando no hay conexión con el servidor", async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));
    const res = await enviarCodigo({ email: "a@b.co", motivo: "registro" });
    expect(res).toEqual({
      ok: false,
      codigoError: "sin_conexion",
      error: "No se pudo conectar con el servidor",
    });
  });
});
