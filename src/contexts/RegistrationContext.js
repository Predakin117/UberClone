// AI-assisted: see docs/AI_LOG.md #3, #4, #7, #10, #12, #54, #59
import { createContext, useMemo, useState } from "react";
import { saveDriverSection } from "../services/driverRepository";
import { validateDocuments } from "../validation/documents";
import { validatePersonalInfo } from "../validation/personalInfo";
import { validateVehicle } from "../validation/vehicle";

export const RegistrationContext = createContext();

const isEmpty = (fieldErrors) => Object.keys(fieldErrors).length === 0;

// AI-assisted: see docs/AI_LOG.md #54
// account: { email, phone } of the logged-in account. Tab 1 shows them already
// filled in and locked, so they can't differ from the ones used to log in.
const ACCOUNT_FIELDS = ["email", "phone"];

export const RegistrationProvider = ({ account, children }) => {
  const lockedFields = ACCOUNT_FIELDS.filter((field) => account?.[field]);

  const [formData, setFormData] = useState({
    // Tab 1: Personal info
    profilePhoto: "",
    name: "",
    documentId: "",
    phone: account?.phone ?? "",
    birthDate: "",
    gender: "",
    email: account?.email ?? "",
    language: "",
    // Tab 2: Vehicle
    category: "",
    plate: "",
    vehicleMake: "",
    vehicleModel: "",
    year: "",
    color: "",
    capacity: "",
    vehiclePhoto: "",
    // Tab 3: Documents and payments (dates as "YYYY-MM-DD", photos as uri)
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

  // Firestore save state. saveError is { section, code }; code is a key of
  // src/i18n/strings.js and section says which tab failed
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fields the driver already visited: only those show their error
  const [touched, setTouched] = useState({});

  // The rules live in src/validation; here they are only computed from the data
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

  // For the Next button: shows the errors of the whole tab at once
  const touchFields = (fields) => {
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    }));
  };

  const isPersonalValid = isEmpty(personalErrors);
  const isVehicleValid = isEmpty(vehicleErrors);
  const isDocsValid = isEmpty(documentErrors);

  // Business rule: the final button is only enabled when all 3 tabs are valid
  const canSubmit = isPersonalValid && isVehicleValid && isDocsValid;

  /**
   * Saves a tab ("personal", "vehicle" or "documents") to Firestore.
   * Returns the uid if it was saved, or null if it failed (the reason goes to saveError).
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
      // Uploaded photos are stored as URLs so they aren't uploaded again
      for (const [field, url] of Object.entries(photoUrls)) {
        handleChange(field, url);
      }
      return uid;
    } catch (error) {
      console.error(
        `Error saving tab ${section}:`,
        error.cause ?? error,
      );
      setSaveError({ section, code: error.code ?? "save.failed" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // AI-assisted: see docs/AI_LOG.md #59
  // Returns the uid once the registration is saved as "Pending approval", or
  // null if it couldn't be sent (the reason goes to saveError). The caller
  // shows RegistrationSubmittedScreen, which opens the main menu.
  const submitRegistration = async () => {
    if (!canSubmit || isSaving) return null;

    // Tabs 1 and 2 are saved again in case the driver went back to them
    // with the tab bar (without tapping Next) and changed something
    if (!(await saveSection("personal"))) return null;
    if (!(await saveSection("vehicle"))) return null;

    // Business rule: moves to "Pending approval"
    return saveSection("documents", { submit: true });
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
