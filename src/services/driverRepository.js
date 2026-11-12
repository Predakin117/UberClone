// AI-assisted: see docs/AI_LOG.md #10, #12, #54
// Saves the driver's registration to Firestore, in the drivers/{uid} document.
// Each tab goes in its own map: personal, vehicle and documents.
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, ensureSignedIn, isFirebaseConfigured } from "../config/firebase";
import { isCloudinaryConfigured, uploadImage } from "./cloudinary";
import { DOC_BUILDERS, photosToUpload } from "./driverDocs";
import { withTimeout } from "./withTimeout";

// Without a connection, setDoc waits forever for the server's response
const SAVE_TIMEOUT_MS = 15000;

// code is a key of src/i18n/strings.js used to show the translated error
export class SaveError extends Error {
  constructor(code, cause) {
    super(code);
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Uploads the tab's photos that are still local and saves the tab to Firestore.
 * Returns { uid, photoUrls } (field → URL) so the form replaces the local paths
 * with the URLs and doesn't upload the same photos again.
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

  // Tab 3 has up to three photos: they are uploaded in parallel
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
    // Business rule: submitting the registration leaves the account pending approval
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
