import { strings } from "../i18n/strings";
import { canReceiveRequests, getAvailabilityBlock } from "./driverStatus";

const loaded = { isLoading: false, error: null };

describe("canReceiveRequests", () => {
  const noTrip = { trip: null, isLoading: false, error: null };

  it("recibe solicitudes conectado, aprobado y sin viaje en curso", () => {
    expect(canReceiveRequests({ isActive: true, activeTrip: noTrip })).toBe(true);
  });

  it("no recibe solicitudes durante un viaje en curso", () => {
    // El bug: el inicio sigue montado debajo del viaje y rechazaba solicitudes
    for (const status of ["accepted", "driver_arriving", "in_progress"]) {
      expect(
        canReceiveRequests({
          isActive: true,
          activeTrip: { ...noTrip, trip: { id: "t1", status } },
        }),
      ).toBe(false);
    }
  });

  it("no recibe solicitudes mientras no sabe si hay un viaje en curso", () => {
    expect(
      canReceiveRequests({
        isActive: true,
        activeTrip: { ...noTrip, isLoading: true },
      }),
    ).toBe(false);
    expect(
      canReceiveRequests({
        isActive: true,
        activeTrip: { ...noTrip, error: "trip.error.loadFailed" },
      }),
    ).toBe(false);
  });

  it("no recibe solicitudes desconectado o sin aprobar", () => {
    expect(canReceiveRequests({ isActive: false, activeTrip: noTrip })).toBe(
      false,
    );
  });
});

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
