import { getRegistrationProgress } from "./progress";

const TODAY = new Date(2026, 10, 5);

const emptyData = {
  profilePhoto: "",
  name: "",
  documentId: "",
  phone: "",
  birthDate: "",
  gender: "",
  email: "",
  language: "",
  category: "",
  plate: "",
  vehicleMake: "",
  vehicleModel: "",
  year: "",
  color: "",
  capacity: "",
  vehiclePhoto: "",
  licenseNumber: "",
  licensePhoto: "",
  licenseExpiry: "",
  soatPhoto: "",
  soatExpiry: "",
  techReviewPhoto: "",
  techReviewExpiry: "",
  mercadoPagoEmail: "",
  acceptedTerms: false,
};

const validData = {
  profilePhoto: "file:///foto.jpg",
  name: "Ana María Pérez",
  documentId: "1234567890",
  phone: "3001234567",
  birthDate: "1995-04-20",
  gender: "female",
  email: "ana@ejemplo.com",
  language: "es",
  category: "economy",
  plate: "ABC123",
  vehicleMake: "Chevrolet",
  vehicleModel: "Spark GT",
  year: "2018", // needs the vehicle inspection
  color: "white",
  capacity: "4",
  vehiclePhoto: "file:///carro.jpg",
  licenseNumber: "1234567890",
  licensePhoto: "file:///licencia.jpg",
  licenseExpiry: "2030-01-15",
  soatPhoto: "file:///soat.jpg",
  soatExpiry: "2027-03-01",
  techReviewPhoto: "file:///rtm.jpg",
  techReviewExpiry: "2027-06-30",
  mercadoPagoEmail: "ana@ejemplo.com",
  acceptedTerms: true,
};

describe("getRegistrationProgress", () => {
  it("starts at 0 % with an empty form", () => {
    const progress = getRegistrationProgress(emptyData, TODAY);
    expect(progress.percent).toBe(0);
    expect(progress.isComplete).toBe(false);
    expect(progress.steps.every((step) => !step.isComplete)).toBe(true);
  });

  it("reaches 100 % only when the 3 tabs are valid", () => {
    const progress = getRegistrationProgress(validData, TODAY);
    expect(progress.percent).toBe(100);
    expect(progress.isComplete).toBe(true);
    expect(progress.steps.map((step) => step.isComplete)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it("marks only the finished tab as complete", () => {
    const personalOnly = {
      ...emptyData,
      ...Object.fromEntries(
        [
          "profilePhoto",
          "name",
          "documentId",
          "phone",
          "birthDate",
          "gender",
          "email",
          "language",
        ].map((field) => [field, validData[field]]),
      ),
    };
    const progress = getRegistrationProgress(personalOnly, TODAY);
    expect(progress.steps.map((step) => step.isComplete)).toEqual([
      true,
      false,
      false,
    ]);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThan(100);
  });

  it("doesn't count invalid values as done", () => {
    const progress = getRegistrationProgress(
      { ...validData, plate: "12" },
      TODAY,
    );
    expect(progress.steps[1].isComplete).toBe(false);
    expect(progress.percent).toBeLessThan(100);
  });

  it("ignores the vehicle inspection when the car doesn't need it", () => {
    const newCar = {
      ...validData,
      year: "2025",
      techReviewPhoto: "",
      techReviewExpiry: "",
    };
    const progress = getRegistrationProgress(newCar, TODAY);
    expect(progress.percent).toBe(100);
  });
});
