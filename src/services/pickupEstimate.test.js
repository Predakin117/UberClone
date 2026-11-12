// AI-assisted: see docs/AI_LOG.md #31
import { haversineKm, pickupEstimate } from "./pickupEstimate";

// Plaza Botero and Estadio Atanasio Girardot, in Medellín
const plazaBotero = { lat: 6.25185, lng: -75.56864 };
const estadio = { latitude: 6.25683, longitude: -75.59015 };

describe("haversineKm", () => {
  it("is 0 for the same point", () => {
    expect(haversineKm(plazaBotero, plazaBotero)).toBe(0);
  });

  it("measures one degree of latitude as about 111 km", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(
      111.19,
      1,
    );
  });

  it("accepts the map and the trip formats", () => {
    // About 2.44 km in a straight line
    expect(haversineKm(estadio, plazaBotero)).toBeCloseTo(2.44, 1);
  });
});

describe("pickupEstimate", () => {
  it("uses 25 km/h and rounds the minutes up", () => {
    // 2.44 km at 25 km/h = 5.9 min → 6 min
    expect(pickupEstimate(estadio, plazaBotero)).toEqual({ km: 2.4, minutes: 6 });
  });

  it("is at least 1 minute when the driver is at the pickup point", () => {
    expect(pickupEstimate(plazaBotero, plazaBotero)).toEqual({
      km: 0,
      minutes: 1,
    });
  });

  it("is null without the driver's location or the pickup point", () => {
    expect(pickupEstimate(null, plazaBotero)).toBeNull();
    expect(pickupEstimate(estadio, { address: "sin coordenadas" })).toBeNull();
  });
});
