import { updateDoc } from "firebase/firestore";
import { auth } from "../config/firebase";
import {
  LOCATION_SAVE_INTERVAL_MS,
  availabilityOnTripChange,
  isDriverAvailable,
  locationFields,
  markDriverUnavailable,
  saveDriverLocation,
  setDriverAvailability,
  shouldSaveLocation,
} from "./driverLocation";

// Jest sube estos mocks antes de los imports: no se usa Firebase real
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((db, coleccion, id) => `${coleccion}/${id}`),
  serverTimestamp: jest.fn(() => "hora-del-servidor"),
  updateDoc: jest.fn(() => Promise.resolve()),
}));
jest.mock("../config/firebase", () => ({
  auth: { currentUser: { uid: "uid-ana" } },
  db: {},
}));

const MEDELLIN = { latitude: 6.2442, longitude: -75.5812 };

describe("shouldSaveLocation", () => {
  it("guarda la primera ubicación de inmediato", () => {
    expect(shouldSaveLocation(null, 1_000)).toBe(true);
  });

  it("guarda como máximo una vez cada 10 segundos", () => {
    expect(LOCATION_SAVE_INTERVAL_MS).toBe(10_000);
    expect(shouldSaveLocation(0, 5_000)).toBe(false);
    expect(shouldSaveLocation(0, 9_999)).toBe(false);
    expect(shouldSaveLocation(0, 10_000)).toBe(true);
  });

  it("con lecturas cada 5 segundos durante un minuto guarda 6", () => {
    let lastSavedMs = null;
    let saves = 0;
    for (let now = 0; now < 60_000; now += 5_000) {
      if (shouldSaveLocation(lastSavedMs, now)) {
        lastSavedMs = now;
        saves += 1;
      }
    }
    expect(saves).toBe(6);
  });
});

describe("locationFields", () => {
  it("guarda { lat, lng }, la hora del servidor y el conductor disponible, sin status", () => {
    const fields = locationFields(MEDELLIN);
    expect(fields).toEqual({
      location: { lat: 6.2442, lng: -75.5812 },
      locationUpdatedAt: "hora-del-servidor",
      isAvailable: true,
    });
    expect(fields).not.toHaveProperty("status");
  });
});

describe("escrituras en drivers/{uid}", () => {
  beforeEach(() => {
    updateDoc.mockClear();
    updateDoc.mockImplementation(() => Promise.resolve());
    auth.currentUser = { uid: "uid-ana" };
  });

  it("saveDriverLocation actualiza solo el documento del conductor", async () => {
    await expect(saveDriverLocation(MEDELLIN)).resolves.toBe(true);
    expect(updateDoc).toHaveBeenCalledWith(
      "drivers/uid-ana",
      locationFields(MEDELLIN),
    );
  });

  it("markDriverUnavailable solo cambia isAvailable", async () => {
    await expect(markDriverUnavailable()).resolves.toBe(true);
    expect(updateDoc).toHaveBeenCalledWith("drivers/uid-ana", {
      isAvailable: false,
    });
  });

  it("sin sesión no escribe", async () => {
    auth.currentUser = null;
    await expect(markDriverUnavailable()).resolves.toBe(false);
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("un fallo de Firestore no lanza", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    updateDoc.mockImplementation(() =>
      Promise.reject(Object.assign(new Error("denied"), { code: "permission-denied" })),
    );
    await expect(saveDriverLocation(MEDELLIN)).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("sin documento del conductor no avisa nada", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    updateDoc.mockImplementation(() =>
      Promise.reject(Object.assign(new Error("no doc"), { code: "not-found" })),
    );
    await expect(markDriverUnavailable()).resolves.toBe(false);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("disponibilidad con un viaje en curso", () => {
  it("solo está disponible conectado y sin viaje en curso", () => {
    expect(isDriverAvailable({ isOnline: true, hasActiveTrip: false })).toBe(true);
    expect(isDriverAvailable({ isOnline: true, hasActiveTrip: true })).toBe(false);
    expect(isDriverAvailable({ isOnline: false, hasActiveTrip: false })).toBe(false);
  });

  it("guarda la ubicación con isAvailable en false durante el viaje", () => {
    expect(locationFields(MEDELLIN, false).isAvailable).toBe(false);
  });

  it("al empezar un viaje lo marca no disponible y al terminarlo, disponible", () => {
    const conectado = { isOnline: true };
    expect(
      availabilityOnTripChange({ ...conectado, hadActiveTrip: false, hasActiveTrip: true }),
    ).toBe(false);
    expect(
      availabilityOnTripChange({ ...conectado, hadActiveTrip: true, hasActiveTrip: false }),
    ).toBe(true);
  });

  it("no escribe si el viaje no cambió o si está desconectado", () => {
    expect(
      availabilityOnTripChange({ isOnline: true, hadActiveTrip: true, hasActiveTrip: true }),
    ).toBeNull();
    expect(
      availabilityOnTripChange({ isOnline: false, hadActiveTrip: true, hasActiveTrip: false }),
    ).toBeNull();
  });

  it("setDriverAvailability solo cambia isAvailable", async () => {
    updateDoc.mockClear();
    updateDoc.mockImplementation(() => Promise.resolve());
    await expect(setDriverAvailability(true)).resolves.toBe(true);
    expect(updateDoc).toHaveBeenCalledWith("drivers/uid-ana", { isAvailable: true });
  });
});
