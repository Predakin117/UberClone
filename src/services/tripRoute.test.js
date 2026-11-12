import polyline from "@mapbox/polyline";
import { hasRealRoute, routeCoordinates } from "./tripRoute";

const trip = {
  origin: { lat: 6.25185, lng: -75.56864, address: "Plaza Botero" },
  destination: { lat: 6.25683, lng: -75.59015, address: "Estadio" },
};

describe("routeCoordinates", () => {
  it("decodifica routePolyline a { latitude, longitude }", () => {
    const routePolyline = polyline.encode([
      [6.25185, -75.56864],
      [6.2539, -75.5791],
      [6.25683, -75.59015],
    ]);
    expect(routeCoordinates({ ...trip, routePolyline })).toEqual([
      { latitude: 6.25185, longitude: -75.56864 },
      { latitude: 6.2539, longitude: -75.5791 },
      { latitude: 6.25683, longitude: -75.59015 },
    ]);
    expect(hasRealRoute({ ...trip, routePolyline })).toBe(true);
  });

  it("dibuja una línea recta si routePolyline es null", () => {
    const straightLine = [
      { latitude: 6.25185, longitude: -75.56864 },
      { latitude: 6.25683, longitude: -75.59015 },
    ];
    expect(routeCoordinates({ ...trip, routePolyline: null })).toEqual(
      straightLine,
    );
    expect(routeCoordinates(trip)).toEqual(straightLine);
    expect(hasRealRoute({ ...trip, routePolyline: null })).toBe(false);
  });
});
