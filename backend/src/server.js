// AI-assisted: see docs/AI_LOG.md #11, #26
// Punto de entrada: npm start  (lee backend/.env con --env-file)
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApp } = require("./app");
const { createVerificationStore } = require("./verification");
const { createGmailSender } = require("./mailer");
const { crearPagos } = require("./pagos");

const user = process.env.MAIL_USER;
// Google muestra la contraseña de aplicación con espacios; se quitan por si quedaron
const pass = (process.env.MAIL_PASS || "").replace(/\s+/g, "");
const port = Number(process.env.PORT) || 3000;

if (!user || !pass) {
  console.error("Faltan MAIL_USER o MAIL_PASS en backend/.env (mirá backend/.env.example)");
  process.exit(1);
}

// Los pagos escriben en Firestore con firebase-admin. Sin la clave de servicio el
// backend arranca igual (códigos por correo y rutas) y la ruta de pagos responde 503.
const CLAVE = path.join(__dirname, "..", "serviceAccountKey.json");
function iniciarPagos() {
  if (!fs.existsSync(CLAVE)) {
    console.warn("Sin backend/serviceAccountKey.json: los pagos quedan desactivados");
    return null;
  }
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore } = require("firebase-admin/firestore");
  const firebase = initializeApp({ credential: cert(CLAVE) });
  const { project_id: proyecto } = JSON.parse(fs.readFileSync(CLAVE, "utf8"));
  console.log(`Pagos conectados al proyecto de Firebase ${proyecto}`);
  return crearPagos({ auth: getAuth(firebase), db: getFirestore(firebase) });
}

const app = createApp({
  store: createVerificationStore({
    ttlMinutes: Number(process.env.CODE_TTL_MINUTES) || 10,
  }),
  enviarCorreo: createGmailSender({ user, pass }),
  pagos: iniciarPagos(),
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend de verificación corriendo en el puerto ${port}`);
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
  for (const ip of ips) {
    console.log(`  EXPO_PUBLIC_BACKEND_API_URL=http://${ip}:${port}/api/v1`);
  }
});
