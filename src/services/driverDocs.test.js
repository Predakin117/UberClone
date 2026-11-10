import {
  isUploaded,
  photosToUpload,
  toDocumentsDoc,
  toPersonalDoc,
  toVehicleDoc,
} from "./driverDocs";

// Fecha fija: el vehículo 2020 tiene 6 años y necesita revisión técnico-mecánica
const TODAY = new Date(2026, 10, 5);

const formData = {
  profilePhoto: "https://res.cloudinary.com/demo/image/upload/perfil.jpg",
  name: "  Ana   María Pérez ",
  documentId: " 1234567890 ",
  phone: "3001234567",
  birthDate: "1995-04-20",
  gender: "female",
  email: " Ana@Ejemplo.COM ",
  language: "es",
  category: "xl",
  plate: " abc123 ",
  vehicleMake: " Chevrolet ",
  vehicleModel: "Spin",
  year: "2020",
  color: "white",
  capacity: "7",
  vehiclePhoto: "https://res.cloudinary.com/demo/image/upload/carro.jpg",
  licenseNumber: " 987654 ",
  licensePhoto: "https://res.cloudinary.com/demo/image/upload/licencia.jpg",
  licenseExpiry: "2030-01-15",
  soatPhoto: "https://res.cloudinary.com/demo/image/upload/soat.jpg",
  soatExpiry: "2027-03-01",
  techReviewPhoto: "https://res.cloudinary.com/demo/image/upload/rtm.jpg",
  techReviewExpiry: "2027-06-30",
  mercadoPagoEmail: " Pagos@Ejemplo.com ",
  acceptedTerms: true,
};

describe("driverDocs", () => {
  it("limpia los datos personales antes de guardarlos", () => {
    expect(toPersonalDoc(formData)).toEqual({
      profilePhotoUrl: formData.profilePhoto,
      name: "Ana María Pérez",
      documentId: "1234567890",
      phone: "3001234567",
      birthDate: "1995-04-20",
      gender: "female",
      email: "ana@ejemplo.com",
      language: "es",
    });
  });

  it("guarda la placa en mayúsculas y el año y la capacidad como números", () => {
    expect(toVehicleDoc(formData)).toEqual({
      category: "xl",
      plate: "ABC123",
      make: "Chevrolet",
      model: "Spin",
      year: 2020,
      color: "white",
      capacity: 7,
      photoUrl: formData.vehiclePhoto,
    });
  });

  it("guarda los documentos con la comisión aceptada", () => {
    expect(toDocumentsDoc(formData, TODAY)).toEqual({
      license: {
        number: "987654",
        photoUrl: formData.licensePhoto,
        expiry: "2030-01-15",
      },
      soat: { photoUrl: formData.soatPhoto, expiry: "2027-03-01" },
      techReview: {
        photoUrl: formData.techReviewPhoto,
        expiry: "2027-06-30",
      },
      mercadoPagoEmail: "pagos@ejemplo.com",
      termsAccepted: true,
      acceptedCommissionRate: 0.2,
    });
  });

  it("no guarda revisión técnico-mecánica si el vehículo no la necesita", () => {
    expect(toDocumentsDoc({ ...formData, year: "2024" }, TODAY).techReview).toBe(
      null,
    );
  });

  it("distingue una foto ya subida de una ruta local", () => {
    expect(isUploaded(formData.profilePhoto)).toBe(true);
    expect(isUploaded("file:///data/user/0/foto.jpg")).toBe(false);
    expect(isUploaded("content://media/external/images/1")).toBe(false);
    expect(isUploaded("")).toBe(false);
  });

  describe("photosToUpload", () => {
    const local = {
      ...formData,
      licensePhoto: "file:///licencia.jpg",
      soatPhoto: "file:///soat.jpg",
      techReviewPhoto: "file:///rtm.jpg",
    };

    it("sube solo las fotos locales de la pestaña", () => {
      expect(photosToUpload("documents", local, TODAY)).toEqual([
        "licensePhoto",
        "soatPhoto",
        "techReviewPhoto",
      ]);
      expect(photosToUpload("documents", formData, TODAY)).toEqual([]);
      expect(photosToUpload("personal", formData, TODAY)).toEqual([]);
    });

    it("omite la revisión técnico-mecánica si no se necesita y las fotos vacías", () => {
      expect(
        photosToUpload("documents", { ...local, year: "2024" }, TODAY),
      ).toEqual(["licensePhoto", "soatPhoto"]);
      expect(
        photosToUpload("documents", { ...local, soatPhoto: "" }, TODAY),
      ).toEqual(["licensePhoto", "techReviewPhoto"]);
    });
  });
});
