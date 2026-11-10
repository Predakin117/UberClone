// AI-assisted: see docs/AI_LOG.md #10
// Guarda el registro del conductor en Firestore, en el documento drivers/{uid}.
// Cada pestaña queda en su propio mapa: personal, vehicle y documents.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, ensureSignedIn, isFirebaseConfigured } from "../config/firebase";
import { isCloudinaryConfigured, uploadImage } from "./cloudinary";
import { DOC_BUILDERS, isUploaded, PHOTO_FIELD_BY_SECTION } from "./driverDocs";

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

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);

/**
 * Sube la foto de la pestaña (si aún es local) y guarda la pestaña en Firestore.
 * Devuelve { uid, photoUrl } para que el formulario reemplace la ruta local por la URL
 * y no vuelva a subir la misma foto.
 */
export const saveDriverSection = async (
  section,
  formData,
  { submit = false } = {},
) => {
  const photoField = PHOTO_FIELD_BY_SECTION[section];
  const needsUpload = photoField && !isUploaded(formData[photoField]);

  if (!isFirebaseConfigured || (needsUpload && !isCloudinaryConfigured)) {
    throw new SaveError("save.notConfigured");
  }

  let data = formData;
  let photoUrl = null;
  if (needsUpload) {
    try {
      photoUrl = await uploadImage(formData[photoField]);
    } catch (error) {
      throw new SaveError("save.photoFailed", error);
    }
    data = { ...formData, [photoField]: photoUrl };
  }

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
    return { uid: user.uid, photoUrl };
  } catch (error) {
    const code =
      error.code === "permission-denied"
        ? "save.permissionDenied"
        : "save.failed";
    throw new SaveError(code, error);
  }
};
