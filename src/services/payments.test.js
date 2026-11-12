import { env } from "../config/env";
import { auth } from "../config/firebase";
import { strings } from "../i18n/strings";
import {
  PAYMENT_ERROR_CODES,
  markCashReceived,
  startMercadoPagoPayment,
} from "./payments";

// Jest sube estos mocks antes de los imports: ni Firebase real ni .env
jest.mock("../config/env", () => ({
  env: { backendApiUrl: "http://192.168.0.10:3000/api/v1" },
}));
jest.mock("../config/firebase", () => ({
  auth: {
    currentUser: { getIdToken: jest.fn(() => Promise.resolve("token-123")) },
  },
}));

const respuesta = (status, body) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

const conductor = auth.currentUser;

describe("startMercadoPagoPayment", () => {
  it("responde sin lanzar mientras no está implementada", async () => {
    await expect(startMercadoPagoPayment("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "no_implementado",
    });
    expect(PAYMENT_ERROR_CODES).toContain("no_implementado");
  });
});

describe("markCashReceived", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    env.backendApiUrl = "http://192.168.0.10:3000/api/v1";
    auth.currentUser = conductor;
  });

  it("manda el tripId con el token del conductor en Authorization", async () => {
    global.fetch.mockReturnValue(respuesta(200, { ok: true }));

    await expect(markCashReceived("viaje-1")).resolves.toEqual({ ok: true });
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe("http://192.168.0.10:3000/api/v1/pagos/efectivo");
    expect(opciones.method).toBe("POST");
    expect(opciones.headers.Authorization).toBe("Bearer token-123");
    expect(JSON.parse(opciones.body)).toEqual({ tripId: "viaje-1" });
  });

  it("devuelve el código de error del backend sin lanzar", async () => {
    global.fetch.mockReturnValue(
      respuesta(403, { ok: false, codigoError: "no_es_tu_viaje", error: "..." }),
    );
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "no_es_tu_viaje",
    });
  });

  it("un código que la app no conoce llega como fallo", async () => {
    global.fetch.mockReturnValue(
      respuesta(503, { ok: false, codigoError: "pagos_no_configurados" }),
    );
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "fallo",
    });
  });

  it("avisa cuando no hay conexión con el backend", async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "sin_conexion",
    });
  });

  it("sin sesión no llama al backend", async () => {
    auth.currentUser = null;
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "sin_sesion",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sin EXPO_PUBLIC_BACKEND_API_URL no llama al backend", async () => {
    env.backendApiUrl = undefined;
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "sin_backend",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// AI-assisted: see docs/AI_LOG.md #28
describe("PAYMENT_ERROR_CODES", () => {
  it("every code has its payment.error text in Spanish and English", () => {
    for (const code of PAYMENT_ERROR_CODES) {
      expect(strings.es[`payment.error.${code}`]).toBeDefined();
      expect(strings.en[`payment.error.${code}`]).toBeDefined();
    }
  });
});
