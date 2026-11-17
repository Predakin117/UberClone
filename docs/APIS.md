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
  - `passengerRating` (entero de 1 a 5) es un campo extra de `trips`, fuera de la
    tabla de la sección 6: la calificación que el conductor le da al pasajero.
    Lo escribe el conductor del viaje una sola vez, con el viaje `completed` o
    `paid` (`firestore.rules` y `validatePassengerRating` en `src/services/trips.js`).
    `rating` sigue siendo la calificación del conductor, que él nunca escribe.
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

### 9. Mercado Pago Checkout Pro (modo prueba)

- **Para qué:** cobrar el viaje con tarjetas de prueba (sección 4 del enunciado).
- **Dónde:**
  - Backend: `backend/src/mercadoPago.js` es el único archivo que llama a la API
    de Mercado Pago, con el `fetch` de Node (sin SDK). La lógica del cobro está en
    `createMercadoPagoPayments` de `backend/src/pagos.js`.
  - App: `src/services/payments.js` (`startMercadoPagoPayment` y
    `checkMercadoPagoPayment`) y el botón `src/components/MercadoPagoCharge.js`
    del resumen del viaje, que abre el checkout con `expo-web-browser`.
- **Variables:** `MP_ACCESS_TOKEN` en `backend/.env`: el Access Token de prueba
  de la cuenta de prueba del vendedor, que empieza por `APP_USR`.
  `PUBLIC_BACKEND_URL` (el túnel, sección 8) es opcional.
- **Rutas del backend** (bajo `/api/v1`):
  - `POST /pagos/mercadopago` `{ tripId, amount }`, con el token del conductor:
    crea la preferencia y responde `{ ok, url }`.
  - `POST /pagos/mercadopago/verificar` `{ tripId }`, con el token del
    conductor: busca el pago del viaje en Mercado Pago y lo guarda.
  - `POST /pagos/mercadopago/webhook`: aviso de Mercado Pago (sin token).
  - `GET /pagos/mercadopago/retorno`: página a la que vuelve el pasajero después
    de pagar (sin token).
- **Flujo:**
  1. El conductor toca "Cobrar con Mercado Pago" en el resumen del viaje.
  2. La app manda `tripId` y el monto (tarifa + propina). El backend revisa que el
     viaje sea del conductor, esté `completed`, sea `mercadopago` y que el monto
     coincida, y crea la preferencia con `external_reference = tripId`.
  3. La app abre el checkout y el pasajero paga con una tarjeta de prueba.
  4. El backend se entera por el webhook, por la página de regreso o porque la
     app pregunta al volver del navegador (`verificar`). En los tres casos
     consulta el pago a Mercado Pago y guarda `paymentStatus`, `paymentId` y, si
     está aprobado, `status: "paid"`.
  5. El resumen escucha el viaje en tiempo real y muestra el estado. Con el
     túnel, la página de regreso abre la app sola (con el enlace `returnUrl`
     que manda la app) y el navegador se cierra sin que el conductor salga de
     la app.
- **Reglas:**
  - El pago siempre se confirma consultando a Mercado Pago: un aviso falso no
    puede marcar un viaje como pagado.
  - Un pago aprobado solo deja el viaje en `paid` si es en COP y por el monto del
    viaje.
  - La app nunca escribe `paymentStatus`, `paymentId` ni el estado `paid`; las
    reglas de Firestore lo impiden.
  - Sin `PUBLIC_BACKEND_URL` no hay webhook ni página de regreso, porque Mercado
    Pago necesita una dirección https pública. El cobro funciona igual, porque la
    app pregunta al volver del navegador.
  - Sin `MP_ACCESS_TOKEN` o sin `serviceAccountKey.json`, las rutas responden 503
    (`pagos_no_configurados`).
  - Solo credenciales de prueba durante todo el proyecto.
- **Pago dividido (reto opcional de bonificación de la sección 4):**
  - **Idea:** si el conductor vinculó su propia cuenta de Mercado Pago, el dinero
    del viaje ya no entra entero a la plataforma. Mercado Pago lo reparte: la
    parte del conductor (tarifa + propina − comisión) va a la cuenta del
    conductor y la comisión a la plataforma.
  - **Vinculación (OAuth):** en el perfil, "Vincular Mercado Pago" abre la página
    de autorización de Mercado Pago (`backend/src/mercadoPagoOAuth.js`). Mercado
    Pago vuelve a `GET /pagos/mercadopago/oauth` con un código, y el backend lo
    cambia por el token del conductor. Rutas con el token del conductor:
    `POST /pagos/mercadopago/vinculo` (¿está vinculada?), `/vincular` y
    `/desvincular`.
  - **Cobro:** el backend crea la preferencia **con el token del conductor** y
    `marketplace_fee` = la comisión del viaje. Si el conductor no vinculó su
    cuenta, la plataforma cobra el viaje completo, como antes.
  - **Tokens:** se guardan con `firebase-admin` en `mercadoPagoAccounts/{uid}`
    (`backend/src/sellerAccounts.js`). `firestore.rules` no tiene reglas para esa
    colección, así que la app no puede leerla ni escribirla. El token dura 180
    días y el backend lo renueva antes de que venza.
  - **En el viaje:** un pago aprobado con el token del conductor deja
    `paymentSplit: true`, un campo extra de `trips` que solo escribe el backend.
    El saldo de Ganancias no cuenta esos viajes, porque nadie le debe nada a
    nadie.
  - **Variables:** `MP_CLIENT_ID` y `MP_CLIENT_SECRET` de la aplicación de la
    plataforma, en `backend/.env`. Además necesita `PUBLIC_BACKEND_URL`, y en la
    aplicación de Mercado Pago hay que registrar exacta la URL de
    redireccionamiento `<PUBLIC_BACKEND_URL>/api/v1/pagos/mercadopago/oauth`.
    Como la URL del túnel rápido cambia, hay que actualizarla en el panel cada
    vez. Sin estas variables, el pago dividido no aparece en la app.
  - **Comisiones de Mercado Pago:** Mercado Pago descuenta su propia comisión de
    la parte del conductor. La app muestra la ganancia calculada con
    `calculateFare`, sin esa comisión.

## Pendientes

### 10. Notificaciones push (servicio de Expo o FCM)

- **Para qué:** avisar de solicitudes nuevas con la app en segundo plano.
- **Dónde:** app y backend.
- **Reglas:** no funcionan en Expo Go, porque requieren un development build. Se
  hacen al final si alcanza el tiempo.

### 11. API del pasajero de la profesora

- **Para qué:** simular los viajes del lado del pasajero.
- **Dónde:** todavía no sabemos cómo funciona.
- **Reglas:**
  - `passengerName` y `passengerPhone` son campos extra y opcionales de `trips`,
    fuera de la tabla de la sección 6. El simulador (`backend/scripts/simular-solicitud.js`)
    los llena con un pasajero de ejemplo de número inventado. En el viaje en curso, los
    botones de llamar (`tel:`) y de mensaje (`sms:`) solo aparecen si existe
    `passengerPhone`. Cuando llegue la API del pasajero, hay que ver si los manda.
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
