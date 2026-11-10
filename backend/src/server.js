// AI-assisted: see docs/AI_LOG.md #11
// Punto de entrada: npm start  (lee backend/.env con --env-file)
const os = require("node:os");
const { createApp } = require("./app");
const { createVerificationStore } = require("./verification");
const { createGmailSender } = require("./mailer");

const user = process.env.MAIL_USER;
// Google muestra la contraseña de aplicación con espacios; se quitan por si quedaron
const pass = (process.env.MAIL_PASS || "").replace(/\s+/g, "");
const port = Number(process.env.PORT) || 3000;

if (!user || !pass) {
  console.error("Faltan MAIL_USER o MAIL_PASS en backend/.env (mirá backend/.env.example)");
  process.exit(1);
}

const app = createApp({
  store: createVerificationStore({
    ttlMinutes: Number(process.env.CODE_TTL_MINUTES) || 10,
  }),
  enviarCorreo: createGmailSender({ user, pass }),
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
