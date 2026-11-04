<!-- AI-assisted: see docs/AI_LOG.md #51 -->

# UberClone — Versión Conductor

Aplicación móvil para iOS y Android, inspirada en Uber, desde el lado del conductor. Está hecha con React Native y Expo. El conductor se registra con sus datos personales, los del vehículo y sus documentos. Después se pone Disponible para recibir solicitudes de viaje, atiende el viaje y consulta sus ganancias netas, ya descontada la comisión de la plataforma.

**Integrantes:** Tamiro José Solano Muriel y Ximena Rosales Lopez.

## Alcance

- **Avance (5 de noviembre de 2026):** las pestañas 1 (Datos personales) y 2 (Vehículo) del registro del conductor, con todas sus validaciones.
- **Proyecto final (12 de noviembre de 2026):** el resto del enunciado:
  - la pestaña 3 del registro;
  - las solicitudes en tiempo real, la navegación y el cobro con pasarela de pago;
  - el historial y las ganancias.

## Tecnologías

- **Expo SDK 58** y **React Native**, en JavaScript.
- **React Navigation**: Tabs para el registro, Drawer para el menú principal y Stack para el flujo del viaje. El proyecto no usa Expo Router.
- **Mapas y ubicación:** `react-native-maps` y `expo-location`.
- **Fotos:** `expo-image-picker`.
- **Fechas:** `@react-native-community/datetimepicker`.
- **Preferencias y sesión:** `@react-native-async-storage/async-storage`. No guarda datos sensibles.
- **Pruebas:** Jest con `jest-expo`.
- **Linter:** ESLint con `eslint-config-expo`.

## Instalación

**Requisitos:**
- Node.js en versión LTS y Git.
- Para probar la app, una de estas opciones:
  - un celular con [Expo Go](https://expo.dev/go);
  - un emulador de Android o un simulador de iOS.

**Pasos:**

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Predakin117/UberClone.git
   cd UberClone
   ```
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Crear el archivo de variables de entorno (ver la sección siguiente):
   ```bash
   cp .env.example .env
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npx expo start
   ```
   Después, escanear el código QR con Expo Go, o presionar `a` (Android) o `i` (iOS) para abrir la app en el emulador.

Para instalar nuevas dependencias, use `npx expo install <paquete>` en lugar de `npm install <paquete>`. Así se instala la versión compatible con el SDK de Expo.

## Variables de entorno

El archivo `.env.example` tiene los nombres de las variables, sin valores. Hay que copiarlo como `.env` y llenarlo. El `.env` está en el `.gitignore`, así que nunca se sube al repositorio. Durante todo el proyecto solo se usan credenciales de prueba.

| Variable | Uso |
|---|---|
| `GOOGLE_MAPS_API_KEY` | API key de Google Maps para el build nativo de Android. Se lee solo en `app.config.js` y no llega al código de la app. |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | API key del proyecto de Firebase. |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto de Firebase. |
| `EXPO_PUBLIC_BACKEND_API_URL` | URL del backend que creará los pagos. |

Expo solo deja leer desde la app las variables con prefijo `EXPO_PUBLIC_`, y el proyecto las expone en `src/config/env.js`. Por eso las llaves secretas, como el `access_token` de Mercado Pago, nunca llevan ese prefijo: van solo en el `.env` del backend.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo. |
| `npm run android` / `npm run ios` | Abre la app en el emulador de Android o en el simulador de iOS. |
| `npm test` | Ejecuta las pruebas con Jest. |
| `npm run lint` | Revisa el código con ESLint. |
| `npx tsc --noEmit` | Revisa los tipos sin generar archivos. |

## Estructura

```
App.js                  Punto de entrada: proveedores de contexto y navegación
app.json, app.config.js Configuración de Expo (permisos, plugins, Google Maps)
src/
  components/           Campos reutilizables del registro (texto, lista, foto)
  config/               Tarifas y comisión (pricing.js) y variables de entorno (env.js)
  contexts/             Sesión (Auth), registro (Registration) y viaje activo (Trip)
  hooks/                useDriverLocation y useTripRequests
  navigation/           AppNavigator, AuthTabs, MainDrawer y TripStack
  screens/auth/         Pestañas del registro: datos personales, vehículo y documentos
  screens/trip/         Inicio, solicitud entrante, viaje en curso y resumen
  screens/main/         Ganancias
  validation/           Reglas de validación de cada pestaña y sus pruebas
docs/AI_LOG.md          Bitácora de uso de IA
```

## Flujo de trabajo

Nadie hace commits directamente en `main`. Cada integrante trabaja en su propia rama (por ejemplo `tamiro/pestana-1` o `ximena/pestana-2`), y los cambios llegan a `main` mediante un Pull Request que revisa la otra persona.

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
