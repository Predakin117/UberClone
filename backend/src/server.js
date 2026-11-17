// AI-assisted: see docs/AI_LOG.md #11, #26, #62, #63
// Punto de entrada: npm start  (lee backend/.env con --env-file)
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApp } = require("./app");
const { createVerificationStore } = require("./verification");
const { createGmailSender } = require("./mailer");
const { crearPagos, createMercadoPagoPayments } = require("./pagos");
const { createMercadoPago } = require("./mercadoPago");
const { createMercadoPagoOAuth } = require("./mercadoPagoOAuth");
const { createSellerAccounts } = require("./sellerAccounts");

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
  return { auth: getAuth(firebase), db: getFirestore(firebase) };
}

// AI-assisted: see docs/AI_LOG.md #62
// Mercado Pago needs firebase-admin and MP_ACCESS_TOKEN (a test credential).
// PUBLIC_BACKEND_URL (the tunnel) is optional: with it there are webhook and
// return page; without it the app checks the payment when the checkout closes.
function iniciarMercadoPago(firebase) {
  const accessToken = (process.env.MP_ACCESS_TOKEN || "").trim();
  if (!firebase || !accessToken) {
    console.warn("Sin MP_ACCESS_TOKEN o sin firebase-admin: Mercado Pago queda desactivado");
    return null;
  }
  const publicUrl = (process.env.PUBLIC_BACKEND_URL || "").trim();
  if (!publicUrl.startsWith("https://")) {
    console.warn("Sin PUBLIC_BACKEND_URL (https): Mercado Pago funciona sin webhook");
  }
  console.log("Mercado Pago Checkout Pro activo");
  return createMercadoPagoPayments({
    ...firebase,
    mercadoPago: createMercadoPago({ accessToken, publicUrl }),
    ...iniciarPagoDividido(firebase, publicUrl),
  });
}

// AI-assisted: see docs/AI_LOG.md #63
// Split payments (optional bonus): each driver links their Mercado Pago
// account with OAuth. Needs MP_CLIENT_ID and MP_CLIENT_SECRET of the
// platform's application and PUBLIC_BACKEND_URL (https), because Mercado Pago
// comes back to <PUBLIC_BACKEND_URL>/api/v1/pagos/mercadopago/oauth, which
// must be registered in the application. Without them, every trip is charged
// by the platform.
function iniciarPagoDividido(firebase, publicUrl) {
  const clientId = (process.env.MP_CLIENT_ID || "").trim();
  const clientSecret = (process.env.MP_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret || !publicUrl.startsWith("https://")) {
    console.warn(
      "Sin MP_CLIENT_ID, MP_CLIENT_SECRET o PUBLIC_BACKEND_URL (https): el pago dividido queda desactivado",
    );
    return {};
  }
  const redirectUri = `${publicUrl.replace(/\/+$/, "")}/api/v1/pagos/mercadopago/oauth`;
  console.log(`Pago dividido activo. URL de redireccionamiento: ${redirectUri}`);
  return {
    sellers: createSellerAccounts({
      db: firebase.db,
      oauth: createMercadoPagoOAuth({ clientId, clientSecret, redirectUri }),
    }),
    clientFor: (token) => createMercadoPago({ accessToken: token, publicUrl }),
  };
}

const firebase = iniciarPagos();
const app = createApp({
  store: createVerificationStore({
    ttlMinutes: Number(process.env.CODE_TTL_MINUTES) || 10,
  }),
  enviarCorreo: createGmailSender({ user, pass }),
  pagos: firebase ? crearPagos(firebase) : null,
  mercadoPago: iniciarMercadoPago(firebase),
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
