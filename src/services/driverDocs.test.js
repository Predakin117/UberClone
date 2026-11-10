import {
  isUploaded,
  toDocumentsDoc,
  toPersonalDoc,
  toVehicleDoc,
} from "./driverDocs";

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

  it("guarda el número de licencia sin espacios", () => {
    expect(toDocumentsDoc(formData)).toEqual({ licenseNumber: "987654" });
  });

  it("distingue una foto ya subida de una ruta local", () => {
    expect(isUploaded(formData.profilePhoto)).toBe(true);
    expect(isUploaded("file:///data/user/0/foto.jpg")).toBe(false);
    expect(isUploaded("content://media/external/images/1")).toBe(false);
    expect(isUploaded("")).toBe(false);
  });
});
