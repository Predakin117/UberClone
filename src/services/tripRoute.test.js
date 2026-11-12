import polyline from "@mapbox/polyline";
import { pickupRoute, tripRoute } from "./tripRoute";

const trip = {
  origin: { lat: 6.25185, lng: -75.56864, address: "Plaza Botero" },
  destination: { lat: 6.25683, lng: -75.59015, address: "Estadio" },
};
const driver = { lat: 6.2442, lng: -75.5812 };

const encoded = polyline.encode([
  [6.25185, -75.56864],
  [6.2539, -75.5791],
  [6.25683, -75.59015],
]);
const decoded = [
  { latitude: 6.25185, longitude: -75.56864 },
  { latitude: 6.2539, longitude: -75.5791 },
  { latitude: 6.25683, longitude: -75.59015 },
];

describe("tripRoute", () => {
  it("decodifica routePolyline a { latitude, longitude }", () => {
    expect(tripRoute({ ...trip, routePolyline: encoded })).toEqual({
      coordinates: decoded,
      isReal: true,
    });
  });

  it("dibuja una línea recta de origen a destino si routePolyline es null", () => {
    const straightLine = {
      coordinates: [
        { latitude: 6.25185, longitude: -75.56864 },
        { latitude: 6.25683, longitude: -75.59015 },
      ],
      isReal: false,
    };
    expect(tripRoute({ ...trip, routePolyline: null })).toEqual(straightLine);
    expect(tripRoute(trip)).toEqual(straightLine);
  });
});

describe("pickupRoute", () => {
  it("usa la ruta del backend hasta el punto de recogida", () => {
    const result = { ok: true, encodedPolyline: encoded };
    expect(pickupRoute(driver, trip.origin, result)).toEqual({
      coordinates: decoded,
      isReal: true,
    });
  });

  it("dibuja una línea recta del conductor a la recogida si la ruta falla", () => {
    const straightLine = {
      coordinates: [
        { latitude: 6.2442, longitude: -75.5812 },
        { latitude: 6.25185, longitude: -75.56864 },
      ],
      isReal: false,
    };
    expect(
      pickupRoute(driver, trip.origin, { ok: false, codigoError: "sin_conexion" }),
    ).toEqual(straightLine);
    expect(pickupRoute(driver, trip.origin, { ok: true, encodedPolyline: "" })).toEqual(
      straightLine,
    );
  });
});
