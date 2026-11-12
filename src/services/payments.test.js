import {
  PAYMENT_ERROR_CODES,
  markCashReceived,
  startMercadoPagoPayment,
} from "./payments";

describe("contrato de payments.js", () => {
  it("startMercadoPagoPayment responde sin lanzar mientras no está implementada", async () => {
    await expect(startMercadoPagoPayment("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "no_implementado",
    });
  });

  it("markCashReceived responde sin lanzar mientras no está implementada", async () => {
    await expect(markCashReceived("viaje-1")).resolves.toEqual({
      ok: false,
      codigoError: "no_implementado",
    });
  });

  it("documenta el código no_implementado", () => {
    expect(PAYMENT_ERROR_CODES).toContain("no_implementado");
  });
});
