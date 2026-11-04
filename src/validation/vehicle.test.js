// AI-assisted: see docs/AI_LOG.md #9
import { normalizePlate, validateVehicle } from "./vehicle";

const CURRENT_YEAR = 2026;

const validData = {
  category: "economy",
  plate: "ABC123",
  vehicleMake: "Chevrolet",
  vehicleModel: "Spark GT",
  year: "2020",
  color: "white",
  capacity: "4",
  vehiclePhoto: "file:///foto.jpg",
};

const errorsFor = (changes) =>
  validateVehicle({ ...validData, ...changes }, CURRENT_YEAR);

describe("validateVehicle", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(errorsFor({})).toEqual({});
  });

  it("exige todos los campos", () => {
    const empty = Object.fromEntries(
      Object.keys(validData).map((field) => [field, ""]),
    );
    expect(Object.keys(validateVehicle(empty, CURRENT_YEAR)).sort()).toEqual(
      Object.keys(validData).sort(),
    );
  });

  it("acepta solo las categorías y colores de la lista", () => {
    expect(errorsFor({ category: "standard" }).category).toBeDefined();
    expect(errorsFor({ color: "fucsia" }).color).toBeDefined();
  });

  it("convierte la placa a mayúsculas antes de validar", () => {
    expect(normalizePlate("abc-123")).toBe("ABC123");
    expect(errorsFor({ plate: "abc123" }).plate).toBeUndefined();
  });

  it("rechaza placas que no tienen el formato ABC123", () => {
    for (const plate of ["AB1234", "ABC12", "ABC12D", "123ABC", "ABCD123"]) {
      expect(errorsFor({ plate }).plate).toBeDefined();
    }
  });

  it("limita marca y modelo a 30 caracteres", () => {
    const long = "a".repeat(31);
    expect(errorsFor({ vehicleMake: long }).vehicleMake).toBeDefined();
    expect(errorsFor({ vehicleModel: long }).vehicleModel).toBeDefined();
    expect(errorsFor({ vehicleMake: "a".repeat(30) }).vehicleMake).toBeUndefined();
  });

  it("exige un año de 4 dígitos no mayor al actual", () => {
    expect(errorsFor({ year: "20" }).year).toBeDefined();
    expect(errorsFor({ year: "20a0" }).year).toBeDefined();
    expect(errorsFor({ year: "2027" }).year).toBeDefined();
    expect(errorsFor({ year: "2026" }).year).toBeUndefined();
  });

  it("exige una capacidad numérica mayor a 0", () => {
    expect(errorsFor({ capacity: "0" }).capacity).toBeDefined();
    expect(errorsFor({ capacity: "4.5" }).capacity).toBeDefined();
  });

  it("exige mínimo 6 pasajeros para XL", () => {
    expect(errorsFor({ category: "xl", capacity: "5" }).capacity).toBeDefined();
    expect(errorsFor({ category: "xl", capacity: "6" }).capacity).toBeUndefined();
  });
});
