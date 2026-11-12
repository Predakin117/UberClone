import { fetchRoute } from "./routesApi";

// Jest sube este mock antes del import
jest.mock("../config/env", () => ({
  env: { backendApiUrl: "http://192.168.0.10:3000/api/v1" },
}));

const respuesta = (status, body) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

const CONDUCTOR = { lat: 6.2442, lng: -75.5812 };
const RECOGIDA = { lat: 6.26798, lng: -75.56876 };

describe("fetchRoute", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("pide la ruta al backend con origen y destino { lat, lng }", async () => {
    const ruta = { ok: true, distanceKm: 3.1, durationMin: 7, encodedPolyline: "abc" };
    global.fetch.mockReturnValue(respuesta(200, ruta));

    expect(await fetchRoute(CONDUCTOR, RECOGIDA)).toEqual(ruta);
    const [url, opciones] = global.fetch.mock.calls[0];
    expect(url).toBe("http://192.168.0.10:3000/api/v1/rutas");
    expect(JSON.parse(opciones.body)).toEqual({
      origen: CONDUCTOR,
      destino: RECOGIDA,
    });
  });

  it("devuelve el error del backend sin lanzar", async () => {
    global.fetch.mockReturnValue(
      respuesta(502, { ok: false, codigoError: "ruta_no_disponible" }),
    );
    expect(await fetchRoute(CONDUCTOR, RECOGIDA)).toEqual({
      ok: false,
      codigoError: "ruta_no_disponible",
    });
  });

  it("avisa cuando no hay conexión con el backend", async () => {
    global.fetch.mockRejectedValue(new TypeError("Network request failed"));
    expect(await fetchRoute(CONDUCTOR, RECOGIDA)).toEqual({
      ok: false,
      codigoError: "sin_conexion",
    });
  });
});
