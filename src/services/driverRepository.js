// AI-assisted: see docs/AI_LOG.md #10, #12, #54
// Guarda el registro del conductor en Firestore, en el documento drivers/{uid}.
// Cada pestaña queda en su propio mapa: personal, vehicle y documents.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, ensureSignedIn, isFirebaseConfigured } from "../config/firebase";
import { isCloudinaryConfigured, uploadImage } from "./cloudinary";
import { DOC_BUILDERS, photosToUpload } from "./driverDocs";
import { withTimeout } from "./withTimeout";

// Sin conexión, setDoc espera indefinidamente la respuesta del servidor
const SAVE_TIMEOUT_MS = 15000;

// El código es una clave de src/i18n/strings.js para mostrar el error traducido
export class SaveError extends Error {
  constructor(code, cause) {
    super(code);
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Sube las fotos de la pestaña que aún son locales y guarda la pestaña en Firestore.
 * Devuelve { uid, photoUrls } (campo → URL) para que el formulario reemplace las rutas
 * locales por las URL y no vuelva a subir las mismas fotos.
 */
export const saveDriverSection = async (
  section,
  formData,
  { submit = false } = {},
) => {
  const fieldsToUpload = photosToUpload(section, formData);

  if (
    !isFirebaseConfigured ||
    (fieldsToUpload.length > 0 && !isCloudinaryConfigured)
  ) {
    throw new SaveError("save.notConfigured");
  }

  // La pestaña 3 tiene hasta tres fotos: se suben a la vez
  let photoUrls = {};
  if (fieldsToUpload.length > 0) {
    try {
      const urls = await Promise.all(
        fieldsToUpload.map((field) => uploadImage(formData[field])),
      );
      photoUrls = Object.fromEntries(
        fieldsToUpload.map((field, index) => [field, urls[index]]),
      );
    } catch (error) {
      throw new SaveError("save.photoFailed", error);
    }
  }
  const data = { ...formData, ...photoUrls };

  try {
    const user = await ensureSignedIn();
    const payload = {
      [section]: DOC_BUILDERS[section](data),
      updatedAt: serverTimestamp(),
    };
    // Regla de negocio: al enviar el registro la cuenta queda Pendiente de aprobación
    if (submit) {
      payload.status = "pending";
      payload.submittedAt = serverTimestamp();
    }

    await withTimeout(
      setDoc(doc(db, "drivers", user.uid), payload, { merge: true }),
      SAVE_TIMEOUT_MS,
    );
    return { uid: user.uid, photoUrls };
  } catch (error) {
    const code =
      error.code === "permission-denied"
        ? "save.permissionDenied"
        : "save.failed";
    throw new SaveError(code, error);
  }
};
