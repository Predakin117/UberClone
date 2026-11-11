import {
  canDriverChangeStatus,
  completionFields,
  validateDriverUpdate,
} from "./trips";

const ME = "driver-1";
const OTHER = "driver-2";

// Ejemplo del enunciado: 8,5 km y 22 minutos en Económico
const request = {
  driverId: null,
  passengerId: "passenger-1",
  distanceKm: 8.5,
  durationMin: 22,
  category: "economy",
  status: "requested",
};
const myTrip = (status) => ({ ...request, driverId: ME, status });
const completion = (tip) => ({
  ...completionFields(myTrip("in_progress"), tip),
  completedAt: "hora del servidor",
});

describe("trips", () => {
  describe("canDriverChangeStatus", () => {
    it("avanza en el orden accepted → driver_arriving → in_progress → completed", () => {
      expect(canDriverChangeStatus("requested", "accepted")).toBe(true);
      expect(canDriverChangeStatus("accepted", "driver_arriving")).toBe(true);
      expect(canDriverChangeStatus("driver_arriving", "in_progress")).toBe(true);
      expect(canDriverChangeStatus("in_progress", "completed")).toBe(true);
    });

    it("no salta estados ni vuelve atrás", () => {
      expect(canDriverChangeStatus("accepted", "in_progress")).toBe(false);
      expect(canDriverChangeStatus("in_progress", "driver_arriving")).toBe(false);
      expect(canDriverChangeStatus("completed", "in_progress")).toBe(false);
    });

    it("cancela solo antes de in_progress y rechaza solo una solicitud", () => {
      expect(canDriverChangeStatus("accepted", "cancelled")).toBe(true);
      expect(canDriverChangeStatus("driver_arriving", "cancelled")).toBe(true);
      expect(canDriverChangeStatus("in_progress", "cancelled")).toBe(false);
      expect(canDriverChangeStatus("requested", "rejected")).toBe(true);
      expect(canDriverChangeStatus("accepted", "rejected")).toBe(false);
    });

    it("nunca deja al conductor marcar el viaje como pagado", () => {
      for (const from of ["requested", "accepted", "in_progress", "completed"]) {
        expect(canDriverChangeStatus(from, "paid")).toBe(false);
      }
    });
  });

  describe("validateDriverUpdate", () => {
    it("acepta o rechaza una solicitud nueva poniéndola a su nombre", () => {
      for (const status of ["accepted", "rejected"]) {
        expect(
          validateDriverUpdate(request, { status, driverId: ME }, ME, "approved"),
        ).toBeNull();
      }
    });

    it("solo deja tomar solicitudes a un conductor aprobado", () => {
      for (const driverStatus of ["pending", null, undefined]) {
        expect(
          validateDriverUpdate(
            request,
            { status: "accepted", driverId: ME },
            ME,
            driverStatus,
          ),
        ).toBe("notApproved");
      }
    });

    it("no acepta una solicitud ya tomada ni a nombre de otro", () => {
      const taken = { ...request, driverId: OTHER };
      expect(
        validateDriverUpdate(
          taken,
          { status: "accepted", driverId: ME },
          ME,
          "approved",
        ),
      ).toBe("alreadyTaken");
      expect(
        validateDriverUpdate(
          request,
          { status: "accepted", driverId: OTHER },
          ME,
          "approved",
        ),
      ).toBe("notYourTrip");
    });

    it("solo avanza sus propios viajes", () => {
      expect(
        validateDriverUpdate(myTrip("accepted"), { status: "driver_arriving" }, ME),
      ).toBeNull();
      expect(
        validateDriverUpdate(
          myTrip("accepted"),
          { status: "driver_arriving" },
          OTHER,
        ),
      ).toBe("notYourTrip");
    });

    it("no deja escribir los campos del pago ni cambiar el pasajero", () => {
      expect(
        validateDriverUpdate(
          myTrip("in_progress"),
          { ...completion(), paymentStatus: "approved" },
          ME,
        ),
      ).toBe("fieldNotAllowed");
      expect(
        validateDriverUpdate(
          myTrip("accepted"),
          { status: "driver_arriving", passengerId: "otro" },
          ME,
        ),
      ).toBe("fieldNotAllowed");
    });

    it("rechaza un cambio de estado no permitido", () => {
      expect(
        validateDriverUpdate(myTrip("completed"), { status: "paid" }, ME),
      ).toBe("invalidTransition");
    });
  });

  describe("al completar", () => {
    it("cierra el viaje con los montos de calculateFare", () => {
      expect(completionFields(myTrip("in_progress"))).toEqual({
        status: "completed",
        fare: 19200,
        commission: 3840,
        tip: 0,
        driverEarnings: 15360,
        commissionRate: 0.2,
      });
    });

    it("acepta montos coherentes, con o sin propina", () => {
      expect(
        validateDriverUpdate(myTrip("in_progress"), completion(), ME),
      ).toBeNull();
      expect(
        validateDriverUpdate(myTrip("in_progress"), completion(2000), ME),
      ).toBeNull();
    });

    it("rechaza una tarifa inflada, una comisión rebajada o una ganancia que no cuadra", () => {
      for (const tampered of [
        { fare: 25000 },
        { commission: 1000 },
        { commissionRate: 0.1 },
        { driverEarnings: 19200 },
        { tip: -500 },
      ]) {
        expect(
          validateDriverUpdate(
            myTrip("in_progress"),
            { ...completion(), ...tampered },
            ME,
          ),
        ).toBe("invalidAmounts");
      }
    });
  });
});
