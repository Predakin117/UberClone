# APIs y servicios externos

Guía para los dos integrantes y para cualquier sesión de Claude Code: qué
servicios externos usa el proyecto, dónde se llaman y con qué reglas.
`CLAUDE.md` la incluye con `@docs/APIS.md`.

Cada servicio indica para qué lo usamos, su estado (**Activa**, **Pendiente** o
**En veremos**), dónde se llama y en qué archivo, su variable de entorno si
tiene, y sus reglas o límites. Cuando un archivo todavía no existe, se dice en
qué paso se crea.

## Reglas generales

- **Llaves secretas solo en `backend/.env`.** En la app solo van variables
  `EXPO_PUBLIC_` que no son secretas, porque quedan dentro de la app. Cada
  variable nueva se agrega sin valor al `.env.example` que corresponda: el de la
  raíz para la app y `backend/.env.example` para el backend.
- **Cada API externa se usa desde un solo módulo**, para poder cambiar de
  proveedor sin tocar las pantallas.
- **Preferimos lo que funciona en Expo Go.** Cualquier librería con código
  nativo necesita aprobación del equipo, porque obliga a un development build.
- **Rutas: una llamada al crear la solicitud y otra al aceptarla**, nunca en
  cada actualización de ubicación (sección 7 del enunciado). La ruta se guarda
  en el viaje para no volver a pedirla.

## Activas

### 1. OpenRouteService (rutas)

- **Para qué:** calcular la ruta, la distancia y la duración de un viaje. Google
  Maps solo muestra el mapa.
- **Dónde:** backend, en `backend/src/rutas.js`. Lo usan el simulador
  (`backend/scripts/simular-solicitud.js`) y la ruta `POST /api/v1/rutas`
  (`backend/src/app.js`), que la app llama desde `src/services/routesApi.js` para
  la ruta del conductor hasta el punto de recogida.
- **Variable:** `ORS_API_KEY` en `backend/.env`.
- **Uso:** `calcularRuta(origen, destino)` devuelve
  `{ distanceKm, durationMin, encodedPolyline }`. Recibe las coordenadas como
  `[longitud, latitud]`, al revés de Google y de `react-native-maps`.
  `POST /api/v1/rutas` recibe `{ origen: { lat, lng }, destino: { lat, lng } }`.
- **Límites:** cupo diario gratuito. El plan gratuito de rutas permite unas
  2.000 peticiones al día y 40 por minuto.
- **Si falla:** el simulador usa valores fijos de respaldo, y la app dibuja una
  línea recta punteada.
- **Crédito obligatorio:** "© OpenStreetMap contributors".
- **Mejora pendiente (después de la entrega):** proteger `POST /api/v1/rutas`. Hoy
  no exige sesión, así que cualquiera que llegue al backend puede pedir rutas y
  gastar el cupo diario de ORS. Es un riesgo sobre todo si el backend se publica
  con el túnel de Cloudflare. Opciones: exigir el token de Firebase Auth del
  conductor (verificado con `firebase-admin`) y limitar las peticiones por usuario.

### 2. @mapbox/polyline (librería)

- **Para qué:** decodificar `routePolyline` del viaje para dibujarlo con
  `Polyline` de `react-native-maps`.
- **Dónde:** app (se instala con `npx expo install` en el paso 5).
- **Variable:** ninguna.
- **Uso:** `decode` devuelve pares `[lat, lng]`, que se convierten a
  `{ latitude, longitude }` para el mapa.

### 3. reverseGeocodeAsync de expo-location

- **Para qué:** convertir la ubicación del conductor en una dirección legible.
- **Dónde:** app.
- **Variable:** ninguna.
- **Reglas:** se llama solo cuando cambia el punto que se muestra, no en cada
  actualización de ubicación.

### 4. Nominatim (OpenStreetMap)

- **Para qué:** obtener las direcciones de las rutas de ejemplo del simulador.
- **Dónde:** solo backend, en el simulador (`backend/scripts/simular-solicitud.js`,
  paso 5).
- **Variable:** ninguna.
- **Reglas:** máximo 1 petición por segundo, con un User-Agent propio
  obligatorio, y prohibido usarlo para autocompletar. Las direcciones se
  consultan una vez y quedan escritas en el código.

### 5. Firebase Auth y Firestore

- **Para qué:** cuentas (correo y contraseña, o sesión anónima) y base de datos.
- **Dónde:** app y backend.
  - App: `src/config/firebase.js`. Colecciones `drivers`
    (`src/services/driverRepository.js`), `accounts` y `loginIndex`
    (`src/services/accountService.js`) y `trips` (`src/services/trips.js`).
  - Backend: `firebase-admin` con `backend/serviceAccountKey.json`, que está en
    `.gitignore` y nunca se sube.
- **Variables:** `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`,
  `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`,
  `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` y `EXPO_PUBLIC_FIREBASE_APP_ID` en el
  `.env` de la raíz. No son secretas: los datos los protegen las reglas.
- **Reglas:**
  - Tiempo real con `onSnapshot`, siempre con limpieza en el `useEffect`.
  - Los campos y estados de `trips` son el contrato con la API del pasajero: no
    se renombran.
  - Si cambia `firestore.rules`, hay que publicarlas a mano en la consola de
    Firebase (Firestore Database → Reglas → Publicar).
  - El historial (`subscribeToTripHistory` en `src/services/tripRepository.js`)
    necesita un índice compuesto en `trips`: `driverId` ↑, `status` ↑,
    `completedAt` ↓. Se crea en Firestore Database → Índices, o con el link que
    sale en la consola de Metro si falta.

### 6. Cloudinary

- **Para qué:** guardar las fotos del registro.
- **Dónde:** app, `src/services/cloudinary.js`.
- **Variables:** `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` y
  `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` en el `.env` de la raíz.
- **Reglas:** se sube con un upload preset sin firma, así que la app no tiene
  llaves secretas. En Firestore solo se guarda la URL.

### 7. Gmail con contraseña de aplicación

- **Para qué:** enviar los códigos de verificación del correo.
- **Dónde:** backend, `backend/src/mailer.js`.
- **Variables:** `MAIL_USER` y `MAIL_PASS` en `backend/.env`.
- **Reglas:** `MAIL_PASS` es una contraseña de aplicación de 16 letras, que
  requiere verificación en dos pasos. El backend lee el `.env` solo al arrancar:
  después de cambiarla hay que reiniciarlo.

### 8. Cloudflare Quick Tunnel

- **Para qué:** dar una URL pública https al backend, sin abrir puertos.
- **Dónde:** es una herramienta, no código:
  `cloudflared tunnel --url http://localhost:3000`.
- **Variables:** la app lee la URL de `EXPO_PUBLIC_BACKEND_API_URL` (`.env` de la
  raíz) y el backend de `PUBLIC_BACKEND_URL` (`backend/.env`).
- **Reglas:** la URL cambia cada vez que se abre el túnel, así que nunca se
  escribe en el código.

## Pendientes

### 9. Mercado Pago Checkout Pro (modo prueba)

- **Para qué:** cobrar el viaje con tarjetas de prueba (sección 4 del enunciado).
- **Dónde:** backend. Lo implementa Ximena.
- **Variable:** `MP_ACCESS_TOKEN` en `backend/.env`. El token de prueba empieza
  por `APP_USR`.
- **Reglas:**
  - La preferencia se crea con `external_reference = tripId`.
  - El pago se confirma consultando a Mercado Pago, y el backend actualiza el
    viaje con `firebase-admin`.
  - La app nunca escribe `paymentStatus`, `paymentId` ni el estado `paid`; las
    reglas de Firestore lo impiden.

### 10. Notificaciones push (servicio de Expo o FCM)

- **Para qué:** avisar de solicitudes nuevas con la app en segundo plano.
- **Dónde:** app y backend.
- **Reglas:** no funcionan en Expo Go, porque requieren un development build. Se
  hacen al final si alcanza el tiempo.

### 11. API del pasajero de la profesora

- **Para qué:** simular los viajes del lado del pasajero.
- **Dónde:** todavía no sabemos cómo funciona.
- **Reglas:**
  - Solo `src/services/tripRequestsSource.js` sabe de dónde vienen las
    solicitudes. Cuando llegue la API, se cambia ese archivo y las pantallas
    quedan igual.
  - La ubicación del conductor está en `drivers/{uid}`: `location` (`{ lat, lng }`),
    `locationUpdatedAt` (hora del servidor, se guarda como máximo cada 10
    segundos) e `isAvailable` (conectado y sin viaje en curso). Lo escribe
    `src/services/driverLocation.js`.
  - Un conductor con `locationUpdatedAt` de hace más de 1 minuto se trata como
    desconectado, aunque diga `isAvailable: true`: si la app se cierra a la
    fuerza, no alcanza a marcarse no disponible.

## En veremos

### 12. Google Routes API

- **Para qué:** reemplazaría a OpenRouteService dentro de `backend/src/rutas.js`.
- **Reglas:** requiere facturación activa en Google Cloud, restringir la llave y
  activar alertas de presupuesto.
