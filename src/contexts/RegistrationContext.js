// AI-assisted: see docs/AI_LOG.md #3, #4, #7
import { createContext, useContext, useMemo, useState } from "react";
import { validateDocuments } from "../validation/documents";
import { validatePersonalInfo } from "../validation/personalInfo";
import { validateVehicle } from "../validation/vehicle";
import { AuthContext } from "./AuthContext";

export const RegistrationContext = createContext();

const isEmpty = (fieldErrors) => Object.keys(fieldErrors).length === 0;

export const RegistrationProvider = ({ children }) => {
  const { login } = useContext(AuthContext); // Para simular el login al finalizar

  const [formData, setFormData] = useState({
    // Pestaña 1: Datos personales
    profilePhoto: "",
    name: "",
    documentId: "",
    phone: "",
    birthDate: "",
    gender: "",
    email: "",
    language: "",
    // Pestaña 2: Vehículo
    category: "",
    plate: "",
    vehicleMake: "",
    vehicleModel: "",
    year: "",
    color: "",
    capacity: "",
    vehiclePhoto: "",
    // Pestaña 3: Documentos
    licenseNumber: "",
  });

  // Campos que el conductor ya visitó: solo esos muestran su error
  const [touched, setTouched] = useState({});

  // Las reglas viven en src/validation; aquí solo se calculan a partir de los datos
  const personalErrors = useMemo(
    () => validatePersonalInfo(formData),
    [formData],
  );
  const vehicleErrors = useMemo(() => validateVehicle(formData), [formData]);
  const documentErrors = useMemo(
    () => validateDocuments(formData),
    [formData],
  );

  const errors = useMemo(() => {
    const allErrors = {
      ...personalErrors,
      ...vehicleErrors,
      ...documentErrors,
    };
    return Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => touched[field]),
    );
  }, [personalErrors, vehicleErrors, documentErrors, touched]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const touchField = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Para el botón Siguiente: muestra de una vez los errores de toda la pestaña
  const touchFields = (fields) => {
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    }));
  };

  const isPersonalValid = isEmpty(personalErrors);
  const isVehicleValid = isEmpty(vehicleErrors);
  const isDocsValid = isEmpty(documentErrors);

  // Regla de negocio: El botón final solo se habilita si las 3 pestañas son válidas
  const canSubmit = isPersonalValid && isVehicleValid && isDocsValid;

  const submitRegistration = () => {
    if (!canSubmit) return;

    // Regla de negocio: Pasa a "Pendiente de aprobación"
    alert("Registro enviado. Estado: Pendiente de aprobación.");

    // Simulamos que tras la aprobación, el usuario entra a la app:
    login({ id: "driver_123", name: formData.name, status: "pending" });
  };

  return (
    <RegistrationContext.Provider
      value={{
        formData,
        errors,
        handleChange,
        touchField,
        touchFields,
        isPersonalValid,
        isVehicleValid,
        canSubmit,
        submitRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
