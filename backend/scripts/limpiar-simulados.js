// AI-assisted: see docs/AI_LOG.md #25
// Borra de trips SOLO los viajes con passengerId "pasajero-simulado": los de
// npm run simular y npm run simular-historial. Sirve para dejar Firestore limpio
// antes del video. No toca ningún otro viaje.
//
// Uso (desde backend/):  npm run limpiar-simulados
const { comprobarProyecto, iniciarFirebaseAdmin } = require("./proyecto");
const { PASAJERO_SIMULADO } = require("./simular-solicitud");

// Firestore acepta hasta 500 escrituras por lote
const TAMANO_DEL_LOTE = 500;

// Parte una lista en grupos de como máximo "tamano" elementos
function enLotes(lista, tamano = TAMANO_DEL_LOTE) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += tamano) {
    lotes.push(lista.slice(i, i + tamano));
  }
  return lotes;
}

async function main() {
  const proyecto = comprobarProyecto();
  iniciarFirebaseAdmin();
  const { getFirestore } = require("firebase-admin/firestore");
  const db = getFirestore();

  const consulta = await db
    .collection("trips")
    .where("passengerId", "==", PASAJERO_SIMULADO)
    .get();

  for (const grupo of enLotes(consulta.docs)) {
    const lote = db.batch();
    for (const documento of grupo) lote.delete(documento.ref);
    await lote.commit();
  }
  console.log(
    `${consulta.size} viajes de "${PASAJERO_SIMULADO}" borrados de trips en ${proyecto}`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { enLotes };
