// AI-assisted: see docs/AI_LOG.md #50, #54
import { strings } from "../i18n/strings";
import {
  CATEGORY_VALUES,
  COLOR_VALUES,
  normalizePlate,
  validateVehicle,
} from "./vehicle";

// Fixed date so the year rules don't depend on the day the tests run
const TODAY = new Date(2026, 10, 10);

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
  validateVehicle({ ...validData, ...changes }, TODAY);

describe("validateVehicle", () => {
  it("returns {} for a complete and valid form", () => {
    expect(errorsFor({})).toEqual({});
  });

  it("requires category, color and photo", () => {
    const errors = errorsFor({ category: "", color: "", vehiclePhoto: "" });
    expect(errors.category).toBe("errors.categoryRequired");
    expect(errors.color).toBe("errors.colorRequired");
    expect(errors.vehiclePhoto).toBe("errors.vehiclePhotoRequired");
  });

  it("only accepts categories and colors from the list", () => {
    expect(errorsFor({ category: "standard" }).category).toBeDefined();
    expect(errorsFor({ color: "fucsia" }).color).toBeDefined();
  });

  it("uppercases the plate before validating", () => {
    expect(normalizePlate(" abc123 ")).toBe("ABC123");
    expect(errorsFor({ plate: "abc123" }).plate).toBeUndefined();
  });

  it("rejects plates without the ABC123 format", () => {
    expect(errorsFor({ plate: "" }).plate).toBe("errors.plateRequired");
    for (const plate of ["ABC-123", "AB1234", "ABC12D", "123ABC"]) {
      expect(errorsFor({ plate }).plate).toBe("errors.plateInvalid");
    }
  });

  describe("make and model", () => {
    it("accepts real names with spaces, hyphens, numbers and dots", () => {
      for (const vehicleMake of ["Kia", "Mercedes-Benz", "Land Rover"]) {
        expect(errorsFor({ vehicleMake }).vehicleMake).toBeUndefined();
      }
      for (const vehicleModel of ["Spark GT", "CX-5", "Model 3", "C 200", "1.6"]) {
        expect(errorsFor({ vehicleModel }).vehicleModel).toBeUndefined();
      }
    });

    it("does not leave them empty", () => {
      expect(errorsFor({ vehicleMake: "   " }).vehicleMake).toBe(
        "errors.vehicleMakeRequired",
      );
      expect(errorsFor({ vehicleModel: "   " }).vehicleModel).toBe(
        "errors.vehicleModelRequired",
      );
    });

    it("limits them to 30 characters", () => {
      expect(errorsFor({ vehicleMake: "a".repeat(30) }).vehicleMake).toBeUndefined();
      expect(errorsFor({ vehicleMake: "a".repeat(31) }).vehicleMake).toBe(
        "errors.vehicleMakeTooLong",
      );
      expect(errorsFor({ vehicleModel: "a".repeat(31) }).vehicleModel).toBe(
        "errors.vehicleModelTooLong",
      );
    });

    it("rejects symbols, a make with numbers and a one-letter make", () => {
      for (const vehicleMake of ["Chevrolet!", "Kia 2", "K", "Ford--"]) {
        expect(errorsFor({ vehicleMake }).vehicleMake).toBe(
          "errors.vehicleMakeInvalid",
        );
      }
      for (const vehicleModel of ["Spark@", "GT_", "-Spark"]) {
        expect(errorsFor({ vehicleModel }).vehicleModel).toBe(
          "errors.vehicleModelInvalid",
        );
      }
    });
  });

  it("requires a 4-digit year, not in the future and at most 20 years old", () => {
    expect(errorsFor({ year: "2026" }).year).toBeUndefined();
    expect(errorsFor({ year: "2006" }).year).toBeUndefined();
    expect(errorsFor({ year: "" }).year).toBe("errors.yearRequired");
    expect(errorsFor({ year: "99" }).year).toBe("errors.yearInvalid");
    expect(errorsFor({ year: "20a4" }).year).toBe("errors.yearInvalid");
    expect(errorsFor({ year: "2027" }).year).toBe("errors.yearFuture");
    expect(errorsFor({ year: "2005" }).year).toBe("errors.yearTooOld");
  });

  it("requires 4 to 8 passengers, and at least 6 for XL", () => {
    expect(errorsFor({ capacity: "4" }).capacity).toBeUndefined();
    expect(errorsFor({ capacity: "8" }).capacity).toBeUndefined();
    expect(errorsFor({ capacity: "3" }).capacity).toBe("errors.capacityTooLow");
    expect(errorsFor({ capacity: "9" }).capacity).toBe("errors.capacityTooHigh");
    expect(errorsFor({ category: "xl", capacity: "6" }).capacity).toBeUndefined();
    expect(errorsFor({ category: "xl", capacity: "5" }).capacity).toBe(
      "errors.capacityXl",
    );
    expect(errorsFor({ category: "premium", capacity: "4" }).capacity).toBeUndefined();
  });

  it("requires a whole number of passengers", () => {
    expect(errorsFor({ capacity: "" }).capacity).toBe("errors.capacityRequired");
    for (const capacity of ["abc", "4.5", "-4"]) {
      expect(errorsFor({ capacity }).capacity).toBe("errors.capacityInvalid");
    }
  });

  it("has every error, category and color in both languages", () => {
    const empty = Object.fromEntries(
      Object.keys(validData).map((field) => [field, ""]),
    );
    const keys = [
      ...Object.values(validateVehicle(empty, TODAY)),
      ...Object.values(
        errorsFor({
          plate: "AB",
          vehicleMake: "K",
          vehicleModel: "@",
          year: "20",
          capacity: "x",
        }),
      ),
      ...Object.values(
        errorsFor({ vehicleMake: "a".repeat(31), vehicleModel: "a".repeat(31) }),
      ),
      errorsFor({ year: "2027" }).year,
      errorsFor({ year: "1990" }).year,
      errorsFor({ capacity: "2" }).capacity,
      errorsFor({ capacity: "9" }).capacity,
      errorsFor({ category: "xl", capacity: "5" }).capacity,
      ...CATEGORY_VALUES.map((value) => `category.${value}`),
      ...COLOR_VALUES.map((value) => `color.${value}`),
    ];
    for (const key of keys) {
      expect(strings.es[key]).toBeDefined();
      expect(strings.en[key]).toBeDefined();
    }
  });
});
