import { createContext, useContext, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

export const RegistrationContext = createContext();

export const RegistrationProvider = ({ children }) => {
  const { login } = useContext(AuthContext); // Para simular el login al finalizar

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    vehicleMake: "",
    plate: "",
    licenseNumber: "",
  });

  const [errors, setErrors] = useState({});

  // Manejador genérico de cambios que limpia el error al escribir
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validaciones en tiempo real
  const isPersonalValid =
    formData.name.trim() !== "" && formData.email.includes("@");
  const isVehicleValid =
    formData.vehicleMake.trim() !== "" && formData.plate.trim() !== "";
  const isDocsValid = formData.licenseNumber.trim() !== "";

  // Regla de negocio: El botón final solo se habilita si las 3 pestañas son válidas
  const canSubmit = useMemo(() => {
    return isPersonalValid && isVehicleValid && isDocsValid;
  }, [isPersonalValid, isVehicleValid, isDocsValid]);

  const submitRegistration = () => {
    if (!canSubmit) return;

    // Regla de negocio: Pasa a "Pendiente de aprobación"
    console.log("Enviando a BD...", formData);
    alert("Registro enviado. Estado: Pendiente de aprobación.");

    // Simulamos que tras la aprobación, el usuario entra a la app:
    login({ id: "driver_123", name: formData.name, status: "pending" });
  };

  return (
    <RegistrationContext.Provider
      value={{
        formData,
        errors,
        setErrors,
        handleChange,
        canSubmit,
        submitRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
