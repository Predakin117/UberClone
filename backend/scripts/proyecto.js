// AI-assisted: see docs/AI_LOG.md #21, #25
// Protección que comparten los scripts que escriben en Firestore con
// firebase-admin (simular, simular-historial y limpiar-simulados): la clave de
// servicio debe ser del mismo proyecto de Firebase que usa la app. Si no, los
// scripts escribirían (o borrarían) donde la app no mira.
const fs = require("node:fs");
const path = require("node:path");

const CLAVE = path.join(__dirname, "..", "serviceAccountKey.json");
// El .env de la raíz dice a qué proyecto de Firebase se conecta la app
const ENV_DE_LA_APP = path.join(__dirname, "..", "..", ".env");

// Valor de una variable en el texto de un archivo .env (sin comillas), o null
function leerVariableEnv(contenido, nombre) {
  const linea = contenido
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${nombre}=`));
  if (!linea) return null;
  const valor = linea.slice(linea.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  return valor || null;
}

/**
 * La clave de servicio debe ser del mismo proyecto que la app. Devuelve el
 * problema como texto, o null si coinciden.
 */
function revisarProyecto(proyectoDeLaClave, proyectoDeLaApp) {
  if (!proyectoDeLaApp) {
    return "No se encontró EXPO_PUBLIC_FIREBASE_PROJECT_ID en el .env de la raíz: no se puede comprobar el proyecto";
  }
  if (proyectoDeLaClave !== proyectoDeLaApp) {
    return `La clave de servicio es del proyecto "${proyectoDeLaClave}", pero la app usa "${proyectoDeLaApp}". Descarga la clave de "${proyectoDeLaApp}" en backend/serviceAccountKey.json`;
  }
  return null;
}

/**
 * Comprueba que exista la clave y que sea del proyecto de la app, sin conectarse
 * a Firebase. Devuelve el id del proyecto o lanza un error con el problema.
 */
function comprobarProyecto() {
  if (!fs.existsSync(CLAVE)) {
    throw new Error("Falta backend/serviceAccountKey.json (descárgala de la consola de Firebase)");
  }
  const proyectoDeLaClave = JSON.parse(fs.readFileSync(CLAVE, "utf8")).project_id;
  const proyectoDeLaApp = fs.existsSync(ENV_DE_LA_APP)
    ? leerVariableEnv(
        fs.readFileSync(ENV_DE_LA_APP, "utf8"),
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
      )
    : null;
  const problema = revisarProyecto(proyectoDeLaClave, proyectoDeLaApp);
  if (problema) throw new Error(problema);
  return proyectoDeLaClave;
}

/**
 * Inicia firebase-admin con la clave de servicio, que no pasa por las reglas de
 * Firestore. Llamar después de comprobarProyecto. Se carga aquí para que las
 * pruebas de los scripts no necesiten Firebase.
 */
function iniciarFirebaseAdmin() {
  const { initializeApp, cert } = require("firebase-admin/app");
  initializeApp({ credential: cert(CLAVE) });
}

module.exports = {
  leerVariableEnv,
  revisarProyecto,
  comprobarProyecto,
  iniciarFirebaseAdmin,
};
