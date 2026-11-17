import { env } from "../config/env";
import { auth } from "../config/firebase";
import { strings } from "../i18n/strings";
import {
  PAYMENT_ERROR_CODES,
  checkMercadoPagoPayment,
  getMercadoPagoLink,
  linkMercadoPagoAccount,
  markCashReceived,
  startMercadoPagoPayment,
  tripChargeAmount,
  unlinkMercadoPagoAccount,
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
  Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  });

const conductor = auth.currentUser;

// AI-assisted: see docs/AI_LOG.md #62
describe("startMercadoPagoPayment", () => {
  const trip = { id: "viaje-1", fare: 19200, tip: 2000 };

  beforeEach(() => {
    global.fetch = jest.fn();
    env.backendApiUrl = "http://192.168.0.10:3000/api/v1";
    auth.currentUser = conductor;
  });

  it("sends the tripId and the amount (fare + tip) and returns the checkout link", async () => {
    global.fetch.mockReturnValue(
      respuesta(200, { ok: true, url: "https://mp.test/checkout" }),
    );
    await expect(startMercadoPagoPayment(trip)).resolves.toEqual({
      ok: true,
      url: "https://mp.test/checkout",
    });
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe("http://192.168.0.10:3000/api/v1/pagos/mercadopago");
    expect(opciones.headers.Authorization).toBe("Bearer token-123");
    expect(JSON.parse(opciones.body)).toEqual({
      tripId: "viaje-1",
      amount: 21200,
    });
  });

  it("returns the backend error without throwing", async () => {
    global.fetch.mockReturnValue(
      respuesta(409, { ok: false, codigoError: "monto_invalido" }),
    );
    await expect(startMercadoPagoPayment(trip)).resolves.toEqual({
      ok: false,
      codigoError: "monto_invalido",
    });
  });

  it("sends the app's link so the return page opens the app", async () => {
    global.fetch.mockReturnValue(
      respuesta(200, { ok: true, url: "https://mp.test/checkout" }),
    );
    await startMercadoPagoPayment(
      trip,
      "exp://192.168.0.10:8081/--/mercadopago",
    );
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      tripId: "viaje-1",
      amount: 21200,
      returnUrl: "exp://192.168.0.10:8081/--/mercadopago",
    });
  });
});

describe("checkMercadoPagoPayment", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    env.backendApiUrl = "http://192.168.0.10:3000/api/v1";
    auth.currentUser = conductor;
  });

  it("asks the backend for the trip's payment", async () => {
    global.fetch.mockReturnValue(
      respuesta(200, { ok: true, paymentStatus: "approved" }),
    );
    await expect(checkMercadoPagoPayment("viaje-1")).resolves.toEqual({
      ok: true,
      paymentStatus: "approved",
    });
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe(
      "http://192.168.0.10:3000/api/v1/pagos/mercadopago/verificar",
    );
    expect(JSON.parse(opciones.body)).toEqual({ tripId: "viaje-1" });
  });

  it("warns when there is no connection", async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));
    await expect(checkMercadoPagoPayment("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "sin_conexion",
    });
  });
});

describe("tripChargeAmount", () => {
  it("is the fare plus the tip, in integer pesos", () => {
    expect(tripChargeAmount({ fare: 19200, tip: 2000 })).toBe(21200);
    expect(tripChargeAmount({ fare: 6000 })).toBe(6000);
    expect(tripChargeAmount(null)).toBe(0);
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
      respuesta(403, {
        ok: false,
        codigoError: "no_es_tu_viaje",
        error: "...",
      }),
    );
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "no_es_tu_viaje",
    });
  });

  it("un código que la app no conoce llega como fallo", async () => {
    global.fetch.mockReturnValue(
      respuesta(500, { ok: false, codigoError: "codigo_desconocido" }),
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

// AI-assisted: see docs/AI_LOG.md #63
describe("Mercado Pago account link (split payments)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    env.backendApiUrl = "http://192.168.0.10:3000/api/v1";
    auth.currentUser = conductor;
  });

  it("reads whether the account is linked", async () => {
    global.fetch.mockReturnValue(
      respuesta(200, { ok: true, available: true, linked: true }),
    );
    await expect(getMercadoPagoLink()).resolves.toEqual({
      ok: true,
      available: true,
      linked: true,
    });
    expect(global.fetch.mock.calls[0][0]).toBe(
      "http://192.168.0.10:3000/api/v1/pagos/mercadopago/vinculo",
    );
  });

  it("gets the authorization page and unlinks", async () => {
    global.fetch.mockReturnValue(
      respuesta(200, { ok: true, url: "https://auth.mp.test/x" }),
    );
    await expect(linkMercadoPagoAccount()).resolves.toEqual({
      ok: true,
      url: "https://auth.mp.test/x",
    });
    global.fetch.mockReturnValue(respuesta(200, { ok: true }));
    await expect(unlinkMercadoPagoAccount()).resolves.toEqual({ ok: true });
    expect(global.fetch.mock.calls[1][0]).toBe(
      "http://192.168.0.10:3000/api/v1/pagos/mercadopago/desvincular",
    );
  });

  it("returns the error when the backend has no split payments", async () => {
    global.fetch.mockReturnValue(
      respuesta(503, { ok: false, codigoError: "vinculo_no_configurado" }),
    );
    await expect(linkMercadoPagoAccount()).resolves.toEqual({
      ok: false,
      codigoError: "vinculo_no_configurado",
    });
  });
});
