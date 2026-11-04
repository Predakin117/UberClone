// AI-assisted: see docs/AI_LOG.md #50
import { normalizePlate, validateVehicle } from "./vehicle";

const CURRENT_YEAR = new Date().getFullYear();

const validData = {
  category: "economy",
  plate: "ABC123",
  vehicleMake: "Chevrolet",
  vehicleModel: "Spark GT",
  year: String(CURRENT_YEAR),
  color: "white",
  capacity: "4",
  vehiclePhoto: "file:///foto.jpg",
};

const errorsFor = (changes) => validateVehicle({ ...validData, ...changes });

describe("validateVehicle", () => {
  it("devuelve {} con un formulario completo y correcto", () => {
    expect(errorsFor({})).toEqual({});
  });

  it("exige categoría, color y foto", () => {
    const errors = errorsFor({ category: "", color: "", vehiclePhoto: "" });
    expect(errors.category).toBeDefined();
    expect(errors.color).toBeDefined();
    expect(errors.vehiclePhoto).toBeDefined();
  });

  it("acepta solo las categorías y colores de la lista", () => {
    expect(errorsFor({ category: "standard" }).category).toBeDefined();
    expect(errorsFor({ color: "fucsia" }).color).toBeDefined();
  });

  it("convierte la placa a mayúsculas antes de validar", () => {
    expect(normalizePlate(" abc123 ")).toBe("ABC123");
    expect(errorsFor({ plate: "abc123" }).plate).toBeUndefined();
  });

  it("rechaza placas que no tienen el formato ABC123", () => {
    for (const plate of ["ABC-123", "AB1234", ""]) {
      expect(errorsFor({ plate }).plate).toBeDefined();
    }
  });

  it("limita marca y modelo a 30 caracteres y no los deja vacíos", () => {
    expect(errorsFor({ vehicleMake: "a".repeat(30) }).vehicleMake).toBeUndefined();
    expect(errorsFor({ vehicleModel: "a".repeat(30) }).vehicleModel).toBeUndefined();
    for (const text of ["a".repeat(31), "   "]) {
      expect(errorsFor({ vehicleMake: text }).vehicleMake).toBeDefined();
      expect(errorsFor({ vehicleModel: text }).vehicleModel).toBeDefined();
    }
  });

  it("exige un año de 4 dígitos no mayor al actual", () => {
    expect(errorsFor({ year: String(CURRENT_YEAR) }).year).toBeUndefined();
    for (const year of [String(CURRENT_YEAR + 1), "99", "20a4"]) {
      expect(errorsFor({ year }).year).toBeDefined();
    }
  });

  it("exige mínimo 6 pasajeros solo para XL", () => {
    expect(errorsFor({ category: "xl", capacity: "6" }).capacity).toBeUndefined();
    expect(errorsFor({ category: "xl", capacity: "5" }).capacity).toBeDefined();
    expect(errorsFor({ category: "economy", capacity: "4" }).capacity).toBeUndefined();
    expect(errorsFor({ category: "premium", capacity: "4" }).capacity).toBeUndefined();
  });

  it("exige una capacidad entera de 1 o más", () => {
    for (const capacity of ["0", "abc"]) {
      expect(errorsFor({ capacity }).capacity).toBeDefined();
    }
  });
});
