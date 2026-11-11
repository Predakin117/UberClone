import { strings } from "../i18n/strings";
import { getAvailabilityBlock } from "./driverStatus";

const loaded = { isLoading: false, error: null };

describe("getAvailabilityBlock", () => {
  it("deja conectarse solo a un conductor aprobado", () => {
    expect(getAvailabilityBlock({ ...loaded, status: "approved" })).toBeNull();
  });

  it("bloquea mientras el registro está pendiente o sin enviar", () => {
    for (const status of ["pending", null, undefined]) {
      expect(getAvailabilityBlock({ ...loaded, status })).toBe(
        "home.pendingApproval",
      );
    }
  });

  it("explica si el registro fue rechazado", () => {
    expect(getAvailabilityBlock({ ...loaded, status: "rejected" })).toBe(
      "home.rejected",
    );
  });

  it("tiene cada mensaje traducido en los dos idiomas", () => {
    const keys = [
      getAvailabilityBlock({ ...loaded, status: "pending" }),
      getAvailabilityBlock({ ...loaded, status: "rejected" }),
      getAvailabilityBlock({ status: null, isLoading: true, error: null }),
      getAvailabilityBlock({ status: null, isLoading: false, error: "x" }),
    ];
    for (const key of keys) {
      expect(strings.es[key]).toBeDefined();
      expect(strings.en[key]).toBeDefined();
    }
  });

  it("bloquea mientras se consulta el estado o si no se pudo leer", () => {
    expect(
      getAvailabilityBlock({ status: "approved", isLoading: true, error: null }),
    ).toBe("home.checkingStatus");
    expect(
      getAvailabilityBlock({ status: null, isLoading: false, error: "readFailed" }),
    ).toBe("home.statusError");
  });
});
