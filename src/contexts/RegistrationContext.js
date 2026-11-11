// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #10, #12, #54
import { createContext, useContext, useMemo, useState } from "react";
import { saveDriverSection } from "../services/driverRepository";
import { validateDocuments } from "../validation/documents";
import { validatePersonalInfo } from "../validation/personalInfo";
import { validateVehicle } from "../validation/vehicle";
import { AuthContext } from "./AuthContext";

export const RegistrationContext = createContext();

const isEmpty = (fieldErrors) => Object.keys(fieldErrors).length === 0;

// AI-assisted: see docs/AI_LOG.md #54
// account: { email, phone } of the logged-in account. Tab 1 shows them already
// filled in and locked, so they can't differ from the ones used to log in.
const ACCOUNT_FIELDS = ["email", "phone"];

export const RegistrationProvider = ({ account, children }) => {
  const { login } = useContext(AuthContext); // Para simular el login al finalizar
  const lockedFields = ACCOUNT_FIELDS.filter((field) => account?.[field]);

  const [formData, setFormData] = useState({
    // Pestaña 1: Datos personales
    profilePhoto: "",
    name: "",
    documentId: "",
    phone: account?.phone ?? "",
    birthDate: "",
    gender: "",
    email: account?.email ?? "",
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
    // Pestaña 3: Documentos y pagos (fechas "AAAA-MM-DD", fotos como uri)
    licenseNumber: "",
    licensePhoto: "",
    licenseExpiry: "",
    soatPhoto: "",
    soatExpiry: "",
    techReviewPhoto: "",
    techReviewExpiry: "",
    mercadoPagoEmail: "",
    acceptedTerms: false,
  });

  // Estado del guardado en Firestore. saveError es { section, code }; code es una
  // clave de src/i18n/strings.js y section dice en qué pestaña falló
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Campos que el conductor ya visitó: solo esos muestran su error
  const [touched, setTouched] = useState({});

  // Las reglas viven en src/validation; aquí solo se calculan a partir de los datos
  const personalErrors = useMemo(
    () => validatePersonalInfo(formData),
    [formData],
  );
  const vehicleErrors = useMemo(() => validateVehicle(formData), [formData]);
  const documentErrors = useMemo(() => validateDocuments(formData), [formData]);

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
    if (lockedFields.includes(field)) return;
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

  /**
   * Guarda una pestaña ("personal", "vehicle" o "documents") en Firestore.
   * Devuelve el uid si se guardó, o null si falló (el motivo queda en saveError).
   */
  const saveSection = async (section, options) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { uid, photoUrls } = await saveDriverSection(
        section,
        formData,
        options,
      );
      // Las fotos ya subidas se guardan como URL para no subirlas otra vez
      for (const [field, url] of Object.entries(photoUrls)) {
        handleChange(field, url);
      }
      return uid;
    } catch (error) {
      console.error(
        `Error guardando la pestaña ${section}:`,
        error.cause ?? error,
      );
      setSaveError({ section, code: error.code ?? "save.failed" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const submitRegistration = async () => {
    if (!canSubmit || isSaving) return;

    // Se guardan otra vez las pestañas 1 y 2 por si el conductor volvió a ellas
    // con la barra de pestañas (sin tocar Siguiente) y cambió algo
    if (!(await saveSection("personal"))) return;
    if (!(await saveSection("vehicle"))) return;

    // Regla de negocio: Pasa a "Pendiente de aprobación"
    const uid = await saveSection("documents", { submit: true });
    if (!uid) return;

    alert("Registro enviado. Estado: Pendiente de aprobación.");
    login({ id: uid, name: formData.name, status: "pending" });
  };

  return (
    <RegistrationContext.Provider
      value={{
        formData,
        errors,
        handleChange,
        touchField,
        touchFields,
        lockedFields,
        isPersonalValid,
        isVehicleValid,
        isDocsValid,
        canSubmit,
        submitRegistration,
        saveSection,
        isSaving,
        saveError,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
