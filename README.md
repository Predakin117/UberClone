<!-- AI-assisted: see docs/AI_LOG.md #51, #21, #24, #28 -->

# UberClone — Versión Conductor

Aplicación móvil para iOS y Android, inspirada en Uber, desde el lado del conductor. Está hecha con React Native y Expo. El conductor:

1. se registra con sus datos personales, los del vehículo y sus documentos;
2. se pone Disponible y comparte su ubicación en tiempo real;
3. recibe solicitudes de viaje, aunque tenga la app en segundo plano, gracias a las notificaciones push;
4. atiende el viaje con la ruta en el mapa;
5. cobra con Mercado Pago (modo de prueba) o en efectivo;
6. consulta su historial y sus ganancias netas, ya descontada la comisión de la plataforma.

**Integrantes:** Tamiro José Solano Muriel y Ximena Rosales Lopez.

## Contenido

- [Funcionalidades](#funcionalidades)
- [Estados del viaje](#estados-del-viaje)
- [Tarifa, comisión y ganancias](#tarifa-comisión-y-ganancias)
- [Tecnologías](#tecnologías)
- [Cómo se conectan las piezas](#cómo-se-conectan-las-piezas)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Probar el flujo completo](#probar-el-flujo-completo)
- [Notificaciones push](#notificaciones-push)
- [Pruebas y verificaciones](#pruebas-y-verificaciones)
- [Scripts](#scripts)
- [Estructura](#estructura)
- [Datos en Firestore](#datos-en-firestore)
- [Seguridad](#seguridad)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Uso de IA](#uso-de-ia)

## Funcionalidades

Todo lo que pide el enunciado está hecho. Entre paréntesis, la sección del enunciado.

**Cuenta y registro (sección 2)**
- Pantalla de bienvenida, inicio de sesión con correo o celular y contraseña, y creación de la cuenta con Firebase Auth.
- Código de 6 dígitos enviado al correo para confirmar la cuenta y al iniciar sesión.
- Registro en 3 pestañas (Tabs): **Datos personales**, **Vehículo** y **Documentos y pagos**, con todas las validaciones del enunciado. Los errores salen debajo de cada campo, nunca en un `Alert`, y **Enviar registro** solo se habilita cuando las tres pestañas están completas y válidas.
- Fotos desde la cámara o la galería, subidas a Cloudinary. En Firestore solo se guarda la URL.
- Al enviar, la cuenta queda **Pendiente de aprobación**. El conductor no puede ponerse Disponible hasta que `status` cambie a `approved`, cosa que se simula en Firestore.

**Inicio y solicitudes (sección 3)**
- Mapa con la ubicación actual y el interruptor **Disponible / No disponible**. Mientras está Disponible, la ubicación se guarda en Firestore cada 5 segundos. Al pasar a No disponible o salir de la pantalla, el seguimiento se detiene (limpieza del `useEffect`).
- Solicitudes en tiempo real (`onSnapshot`). La tarjeta muestra origen, destino, distancia, duración, categoría, método de pago, tarifa estimada y **ganancia neta estimada**, con la ruta dibujada en el mapa.
- Temporizador de **15 segundos**: si llega a cero, la solicitud se rechaza sola. Botones para aceptar o rechazar.
- Solo se muestran solicitudes que siguen en `requested` y que tienen 2 minutos o menos.

**Viaje en curso (sección 3)**
- Ruta hasta el punto de recogida. Al deslizar **Pasajero a bordo**, la ruta cambia hacia el destino.
- Pasos del viaje (recoger, viajar, cobrar), tiempo de llegada, llamar o enviar un mensaje al pasajero y cancelar antes de `in_progress`.
- Al finalizar se calculan la tarifa, la comisión y la ganancia con `calculateFare`.

**Cobro y resumen (sección 4)**
- Resumen con tarifa final, comisión, propina, ganancia neta y estado del pago en tiempo real: **Aprobado, Pendiente, Rechazado o Efectivo**.
- **Mercado Pago Checkout Pro** en modo de prueba. El backend crea la preferencia con la llave secreta, la app abre el checkout dentro de ella con `react-native-webview` y vuelve sola al resumen al terminar. El backend confirma el pago con el webhook o la URL de retorno y deja el viaje con `paymentStatus`, `paymentId` y `status: "paid"`.
- **Pago en efectivo:** el conductor toca "Recibí efectivo" y el backend deja el viaje en `paid`. La comisión se descuenta del saldo del conductor, que puede quedar en negativo.
- **Pago dividido (reto de bonificación):** el conductor vincula su cuenta de Mercado Pago (OAuth) y Mercado Pago reparte el pago: la parte del conductor va a su cuenta y la comisión a la plataforma (`marketplace_fee`).
- Calificar al pasajero de 1 a 5 al terminar.

**Ganancias (sección 5)**
- Para hoy, la semana y el mes: número de viajes, total facturado, comisiones, propinas, ganancia neta y promedio por viaje, calculados con `useMemo`.
- Gráfica de la semana, comparación con la semana anterior y **saldo** con la plataforma: ganancias de viajes pagados por la pasarela menos comisiones de viajes en efectivo.

**Historial (sección 6)**
- `FlatList` del más reciente al más antiguo, 20 viajes por carga, con filtros **Hoy, Semana, Mes y Rango de fechas** y filtro por método de pago. Si no hay viajes, sale un mensaje vacío.
- Detalle de cada viaje con la ruta guardada dibujada con `Polyline`, duración, distancia, comisión, propina, estado del pago y calificación.

**Perfil y configuración (sección 3)**
- Perfil con foto, nombre y correo de Mercado Pago editables, el vehículo, y los documentos con su vencimiento y cuántos están vigentes.
- Configuración: idioma (español / inglés), comisión, versión y cierre de sesión.

**APIs obligatorias de la sección 7**
- **Notificaciones** de solicitudes nuevas con Firebase Cloud Messaging, con la app en segundo plano o cerrada (ver [Notificaciones push](#notificaciones-push)).
- **Tiempo real** con Firestore (`onSnapshot`) para la ubicación, las solicitudes y el estado del viaje.
- **Geolocalización** continua con `expo-location` (`watchPositionAsync`).

**Detalles estilo Uber Driver**
- Mapa claro de día y oscuro de noche, el carro que gira en el mapa y botón para centrar.
- Botón de deslizar para avanzar el viaje, vibración al llegar una solicitud y la ganancia y los viajes de hoy en el inicio.
- Avisos flotantes y bloques grises mientras carga.

**Para probar sin la app del pasajero:** un simulador en el backend (`npm run simular`) crea solicitudes y envía la notificación push.

## Estados del viaje

El campo `status` de cada viaje controla qué pantalla se muestra:

```
requested ──► accepted ──► driver_arriving ──► in_progress ──► completed ──► paid
    │             │               │
    ▼             └───────────────┴──► cancelled
 rejected
```

| Estado | Significado |
|---|---|
| `requested` | El pasajero pidió el viaje. |
| `accepted` | El conductor aceptó. Si rechaza o se vence el tiempo, queda `rejected`. |
| `driver_arriving` | El conductor va al punto de recogida. |
| `in_progress` | El pasajero está a bordo. |
| `completed` | El viaje terminó y se calcularon tarifa, comisión y ganancia. |
| `paid` | La pasarela confirmó el pago o se registró en efectivo. |
| `cancelled` | Se canceló antes de `in_progress`. |

## Tarifa, comisión y ganancias

Una sola función pura, `calculateFare({ distanceKm, durationMin, category, tip })` en [`src/config/pricing.js`](src/config/pricing.js), devuelve `{ fare, commission, driverEarnings }`. Se usa en la estimación de la solicitud y en el cierre del viaje. Todos los valores son pesos colombianos enteros.

```
Tarifa         = max(Mínima, (Base + km × V_km + min × V_min) × Multiplicador)   → redondeada a 100 COP
Comisión       = Tarifa × 0,20
Ganancia neta  = Tarifa − Comisión + Propina
```

| Parámetro | Valor |
|---|---|
| Tarifa base | 3.500 COP |
| Valor por km | 1.200 COP |
| Valor por minuto | 250 COP |
| Tarifa mínima | 6.000 COP |
| Multiplicador Económico / XL / Premium | 1,0 / 1,4 / 1,8 |
| Comisión | 20 % |

Ejemplo del enunciado (8,5 km, 22 min, sin propina): Económico 19.200 COP de tarifa, 3.840 de comisión y 15.360 de ganancia. XL: 26.900, 5.380 y 21.520. Las pruebas de `pricing` revisan exactamente estos números.

Cada viaje guarda su `commissionRate`, así que un cambio futuro de porcentaje no altera el historial. Las propinas van completas al conductor.

## Tecnologías

| Área | Qué se usa |
|---|---|
| App | **Expo SDK 58**, **React Native 0.88** y React 19, en JavaScript |
| Navegación | React Navigation 7: **Tabs** para el registro, **Drawer** para perfil, historial, ganancias y configuración, y **Stack** para el flujo del viaje. No se usa Expo Router. |
| Mapas y ubicación | `react-native-maps` y `expo-location` |
| Cuentas y datos | Firebase Auth y Firestore, con el SDK web de Firebase. El backend usa `firebase-admin`. |
| Fotos | `expo-image-picker` y Cloudinary (upload preset sin firma) |
| Backend | Node.js con `node:http`, sin Express. Códigos por correo (Nodemailer), rutas, pagos y notificaciones. Detalle en [`backend/README.md`](backend/README.md). |
| Rutas | [OpenRouteService](https://openrouteservice.org/), llamado desde el backend, calcula distancia, duración y trazado. Google Maps solo muestra el mapa. |
| Direcciones | [Nominatim](https://nominatim.openstreetmap.org/) para el simulador (consultadas una vez y guardadas en el código) y `reverseGeocodeAsync` de `expo-location` |
| Pagos | Mercado Pago Checkout Pro en modo de prueba, llamado desde el backend con `fetch` (sin SDK). Checkout dentro de la app con `react-native-webview`. Pago dividido con OAuth y `marketplace_fee`. |
| Notificaciones | Firebase Cloud Messaging: `expo-notifications` y `expo-device` en la app, y `firebase-admin` en el backend. Sin Cloud Functions, así que el proyecto sigue en el plan gratuito (Spark). |
| Otros | `@react-native-community/datetimepicker`, `@react-native-async-storage/async-storage` (solo sesión, idioma y disponibilidad), `@mapbox/polyline` y `@expo/vector-icons` |
| Calidad | Jest con `jest-expo`, `node:test` en el backend, ESLint con `eslint-config-expo` y `tsc --noEmit` |

Datos de mapas: © OpenStreetMap contributors. OpenRouteService y Nominatim usan datos de [OpenStreetMap](https://www.openstreetmap.org/copyright). Todos los servicios externos y sus reglas están en [`docs/APIS.md`](docs/APIS.md).

## Cómo se conectan las piezas

```
                 ┌──────────────────────────┐
                 │     App del conductor    │
                 │  (Expo / React Native)   │
                 └──┬──────────┬─────────┬──┘
     onSnapshot y   │          │ HTTP    │ fotos
     escrituras     │          │         │
                    ▼          ▼         ▼
              ┌──────────┐ ┌────────┐ ┌────────────┐
              │ Firebase │ │Backend │ │ Cloudinary │
              │ Auth y   │◄┤ Node.js│ └────────────┘
              │ Firestore│ └─┬──┬─┬─┘
              └──────────┘   │  │ │
                             │  │ └──► OpenRouteService (rutas)
                             │  └────► Mercado Pago (preferencias, pagos, OAuth)
                             └───────► Firebase Cloud Messaging ──► celular
```

- La app lee y escribe en Firestore lo que es del conductor: su perfil, su ubicación y los cambios de estado del viaje. Las reglas de [`firestore.rules`](firestore.rules) limitan qué puede tocar.
- Lo que necesita una llave secreta pasa por el backend: códigos por correo, rutas, pagos y notificaciones push. El backend usa `firebase-admin` para marcar los viajes como pagados.

## Instalación

**Requisitos**
- Node.js 20.19 o superior y Git.
- Para la app: un celular con [Expo Go](https://expo.dev/go), o un emulador de Android o un simulador de iOS.
- Para las notificaciones push: un celular Android y un **development build** (ver [Notificaciones push](#notificaciones-push)).
- El celular y el computador en la misma red WiFi, para que la app llegue al backend.

**1. Clonar e instalar**
```bash
git clone https://github.com/Predakin117/UberClone.git
cd UberClone
npm install
cd backend && npm install && cd ..
```

**2. Variables de entorno**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```
Llénalas como dice la sección siguiente.

**3. Clave de servicio de Firebase (backend)**

En la consola de Firebase: ⚙️ Configuración del proyecto → Cuentas de servicio → **Generar nueva clave privada**. Guarda el archivo como `backend/serviceAccountKey.json`. Sin ella el backend arranca igual, pero los pagos y las notificaciones quedan desactivados.

**4. Arrancar el backend**
```bash
cd backend
npm start
```
Al arrancar muestra la línea `EXPO_PUBLIC_BACKEND_API_URL=...` con la IP del computador. Cópiala en el `.env` de la raíz.

**5. Arrancar la app** (en otra terminal, desde la raíz)
```bash
npx expo start --clear
```
Escanea el QR con Expo Go, o presiona `a` (Android) o `i` (iOS).

Para instalar dependencias nuevas usa `npx expo install <paquete>`, que elige la versión compatible con el SDK de Expo.

## Variables de entorno

`.env.example` y `backend/.env.example` tienen los nombres sin valores. Los `.env` están en el `.gitignore` y nunca se suben. Solo se usan credenciales de prueba.

**App (`.env` de la raíz)**

| Variable | Uso |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps para el build nativo de Android. Se lee solo en `app.config.js` y no llega al código de la app. |
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID` | Configuración web de Firebase. No son secretas: los datos los protegen las reglas de Firestore. |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary para las fotos del registro. |
| `EXPO_PUBLIC_BACKEND_API_URL` | URL del backend, la que muestra `npm start`. |

**Backend (`backend/.env`)**

| Variable | Uso |
|---|---|
| `PORT` | Puerto del backend (3000). |
| `MAIL_USER`, `MAIL_PASS` | Gmail y su contraseña de aplicación para enviar los códigos. |
| `CODE_TTL_MINUTES` | Minutos que dura cada código (10). |
| `ORS_API_KEY` | OpenRouteService, para las rutas. |
| `MP_ACCESS_TOKEN` | Access Token **de prueba** de Mercado Pago. |
| `PUBLIC_BACKEND_URL` | URL https del túnel de Cloudflare, para el webhook y la página de regreso de Mercado Pago. Opcional. |
| `MP_CLIENT_ID`, `MP_CLIENT_SECRET` | Aplicación de Mercado Pago, para el pago dividido. Opcionales. |

Expo solo deja leer desde la app las variables con prefijo `EXPO_PUBLIC_`, expuestas en [`src/config/env.js`](src/config/env.js). Por eso las llaves secretas, como el `access_token` de Mercado Pago, nunca llevan ese prefijo y van solo en `backend/.env`.

**Archivos que tampoco se suben a git**

| Archivo | Para qué | De dónde sale |
|---|---|---|
| `backend/serviceAccountKey.json` | `firebase-admin`: pagos, simulador y notificaciones | Firebase → Cuentas de servicio |
| `google-services.json` (raíz) | Notificaciones push en el build de Android | Firebase → app Android `com.uberclone.drivers` |

## Probar el flujo completo

1. **Registro:** crea una cuenta en la app, confirma el correo con el código y llena las 3 pestañas.
2. **Aprobación:** en Firestore, cambia `drivers/{uid}.status` a `approved`.
3. **Disponible:** en la app, activa Disponible y acepta el permiso de ubicación.
4. **Solicitud:** desde `backend/` corre
   ```bash
   npm run simular -- [economy|xl|premium] [cash|mercadopago] [1|2|3]
   ```
   Llega la tarjeta con 15 segundos para aceptar.
5. **Viaje:** acepta, desliza **Pasajero a bordo** y luego **Finalizar viaje**.
6. **Cobro:**
   - Efectivo: toca **Recibí efectivo**.
   - Mercado Pago: toca **Cobrar con Mercado Pago** y paga con el comprador de prueba. Con el titular `APRO` se aprueba y con `OTHE` se rechaza.
7. **Historial y ganancias:** abre el menú y revisa el viaje, su detalle y los totales.

Otros scripts del backend:
- `npm run simular-historial -- <correo del conductor>` crea 10 viajes pagados repartidos entre hoy, la semana y el mes, para ver el historial y las ganancias.
- `npm run limpiar-simulados` borra solo los viajes simulados (los de `simular` y `simular-historial`).

Cómo configurar Mercado Pago, el túnel y el pago dividido está paso a paso en [`backend/README.md`](backend/README.md).

## Notificaciones push

Cuando el simulador crea una solicitud, el backend avisa con Firebase Cloud Messaging a los conductores `approved`, Disponibles, con token y con ubicación de hace 10 minutos o menos. El texto va en el idioma del conductor. Al tocar la notificación se abre el mapa con la solicitud y sus 15 segundos.

- **App:** [`src/services/pushNotifications.js`](src/services/pushNotifications.js) y [`src/hooks/usePushNotifications.js`](src/hooks/usePushNotifications.js) piden el permiso, crean el canal de Android `trip-requests` y guardan el token en `drivers/{uid}.fcmToken`.
- **Backend:** [`backend/src/notificaciones.js`](backend/src/notificaciones.js) envía con `firebase-admin` y borra los tokens que FCM ya no reconoce.
- **Costo:** FCM es gratis y no se usan Cloud Functions, así que el proyecto sigue en el plan Spark.

**Importante:** desde el SDK 53, **Expo Go no recibe notificaciones push**. En Expo Go, en el emulador o en iOS la app no hace nada y no falla. Para probarlas:

1. Pon `google-services.json` en la raíz.
2. Conecta un celular Android y corre `npx expo run:android`. Esto instala un development build.
3. Inicia sesión con un conductor `approved`, acepta el permiso de notificaciones y ponte Disponible.
4. Deja la app en segundo plano y, desde `backend/`, corre `npm run simular`.

## Pruebas y verificaciones

Antes de cada Pull Request corremos:

| Comando | Dónde | Qué revisa |
|---|---|---|
| `npm test` | raíz | Pruebas de la app con Jest |
| `npm test` | `backend/` | Pruebas del backend con `node:test`. No envían correos, pagos ni notificaciones de verdad. |
| `npx expo lint` | raíz | ESLint en todo el proyecto |
| `npx tsc --noEmit` | raíz | Revisión de tipos sin generar archivos |

**Qué cubren las pruebas**
- **Registro:** todas las validaciones de las 3 pestañas, en `src/validation/`.
- **Tarifas:** `calculateFare`, con el ejemplo del enunciado.
- **Viajes:** estados permitidos, solicitudes recientes y orden.
- **Ganancias e historial:** totales por día, semana y mes, saldo, semanas de la gráfica, comparación con la semana anterior, filtros y rango de fechas.
- **Perfil:** documentos vigentes y vencimientos.
- **Notificaciones:** el registro del token en la app.
- **Backend:**
  - códigos de verificación y rutas HTTP;
  - pago en efectivo, Mercado Pago (preferencia, webhook y verificación) y pago dividido;
  - rutas con OpenRouteService;
  - simulador;
  - envío de notificaciones: a quién se avisa y qué pasa con los tokens inválidos.

**Pruebas manuales en el celular:** el flujo de [Probar el flujo completo](#probar-el-flujo-completo). Cada entrada de la bitácora dice cómo se verificó su cambio.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia Expo (usa `npx expo start --clear` si Metro falla al leer archivos de OneDrive). |
| `npm run android` / `npm run ios` | Abre la app en el emulador o el simulador. |
| `npx expo run:android` | Compila e instala el development build (necesario para las notificaciones push). |
| `npm test` | Pruebas de la app. |
| `npm run lint` | ESLint. |
| `cd backend && npm start` | Inicia el backend (`npm run dev` lo reinicia al guardar). |
| `cd backend && npm run simular` | Crea una solicitud de prueba y envía la notificación. |

## Estructura

```
App.js                   Punto de entrada: proveedores de contexto y navegación
app.json, app.config.js  Configuración de Expo (permisos, plugins, Google Maps, FCM)
firestore.rules          Reglas de seguridad de Firestore
src/
  components/            Piezas reutilizables: campos del registro, tarjeta de solicitud,
                         botón de deslizar, cobro (efectivo y Mercado Pago), checkout
                         dentro de la app, avisos, gráfica de ganancias, etc.
  config/                Tarifas y comisión (pricing.js), Firebase, tema, estilos del mapa y env.js
  contexts/              Sesión (Auth), idioma, registro y viaje en curso (Trip)
  hooks/                 useDriverLocation, useTripRequests, useEarnings, useActiveTrip,
                         useTripHistory, usePushNotifications y otros
  i18n/                  Textos en español e inglés (strings.js) y formatos de fechas y pesos
  navigation/            AppNavigator, AuthTabs, MainDrawer, TripStack y HistoryStack
  screens/auth/          Bienvenida, inicio de sesión, código y las 3 pestañas del registro
  screens/trip/          Inicio, viaje en curso y resumen del cobro
  screens/main/          Perfil, historial, detalle del viaje, ganancias y configuración
  services/              Firebase, viajes, pagos, ganancias, rutas, notificaciones y su lógica pura
  validation/            Reglas de validación de cada pestaña
backend/
  src/                   Servidor: códigos, rutas, pagos, Mercado Pago y notificaciones
  scripts/               Simulador de solicitudes y de historial
  test/                  Pruebas del backend
docs/
  AI_LOG.md              Bitácora de uso de IA
  APIS.md                Servicios externos que usa el proyecto y sus reglas
```

Las pruebas de la app están al lado de cada archivo (`*.test.js`).

## Datos en Firestore

| Colección | Qué guarda | Quién escribe |
|---|---|---|
| `drivers/{uid}` | Perfil, vehículo, documentos, `status` del registro, `isAvailable`, ubicación y token de notificaciones | La app (el dueño) y el backend |
| `trips/{tripId}` | Los viajes, con los campos de la sección 6 | El simulador (o la app del pasajero), la app del conductor y el backend (pagos) |
| `accounts/{uid}`, `loginIndex/{key}` | Datos de la cuenta y búsqueda por correo o celular para iniciar sesión | La app |
| `mercadoPagoAccounts/{uid}` | Tokens del pago dividido | Solo el backend: la app no puede leerlos |

Campos de `trips`: `driverId`, `passengerId`, `origin`, `destination` (`{ lat, lng, address }`), `distanceKm`, `durationMin`, `category` (`economy`, `xl`, `premium`), `fare`, `commission`, `tip`, `driverEarnings`, `commissionRate`, `paymentMethod` (`mercadopago`, `stripe`, `cash`), `paymentStatus`, `paymentId`, `status`, `rating`, `createdAt` y `completedAt`.

## Seguridad

- El `access_token` de Mercado Pago y las demás llaves secretas solo están en `backend/.env`, nunca en la app.
- `.env`, `backend/.env`, `serviceAccountKey.json` y `google-services.json` están en `.gitignore`. El repositorio solo trae los `.env.example`.
- Solo se usan credenciales y cuentas de prueba.
- No se guardan números de cuenta ni de tarjeta. AsyncStorage solo guarda la sesión, el idioma y el último estado de disponibilidad.
- El backend nunca confía en el aviso de Mercado Pago: siempre consulta el pago en Mercado Pago antes de marcar el viaje como pagado.
- `firestore.rules` solo deja al conductor cambiar sus propios datos y sus viajes.

## Flujo de trabajo

Nadie hace commits directamente en `main`. Cada integrante trabaja en su propia rama (`tamiro/...` o `ximena/...`), con commits pequeños en inglés (`feat:`, `fix:`, `docs:`), y los cambios llegan a `main` mediante un Pull Request que revisa la otra persona.

## Uso de IA

El equipo usó herramientas de inteligencia artificial (Gemini y Claude Code) durante el desarrollo. Todo uso queda registrado en la bitácora [`docs/AI_LOG.md`](docs/AI_LOG.md). Cada entrada tiene:
- el prompt;
- el resumen de la respuesta;
- qué se usó, qué se modificó y qué se descartó;
- los archivos y el commit;
- la verificación;
- el aprendizaje.

Tamiro numera sus entradas desde la #1 y Ximena desde la #50.

En el código, los bloques asistidos por IA tienen un comentario que remite a su entrada, por ejemplo:

```js
// AI-assisted: see docs/AI_LOG.md #50
```
