### Entrada #1

Fecha: 2026-10-23
Integrante: Tamiro José Solano Muriel
Herramienta: Gemini
Objetivo: Configurar la estructura base de carpetas, inicializar el proyecto en Expo e instalar las dependencias principales para navegación, geolocalización y mapas.
Prompt: "configuracion de espo y estructura de carpetas"
Resumen de la respuesta: Se proporcionaron los comandos de consola para crear el proyecto de Expo e instalar dependencias clave. Se definió una estructura de carpetas modular dentro de `src/` (incluyendo hooks, contexts y config) y se creó un archivo `.env.example` para proteger datos sensibles.
Qué se usó / modificó / descartó: [Explica qué código copiaste tal cual, qué ajustaste para tu proyecto y qué decidiste no usar]
Archivos y commit: [Rutas afectadas, ej: package.json, src/, .env.example] / [Hash del commit, ej: a1b2c3d]
Verificación: [Cómo comprobaste que funcionaba. Ej: Ejecución de `npx expo start` y verificación de creación de carpetas]
Aprendizaje: [Qué entendiste de la solución dada y qué harías distinto]

### Entrada #2

Fecha: 2026-10-23
Integrante: Tamiro José Solano Muriel
Herramienta: Gemini
Objetivo: Configurar la estructura base de navegación combinada (Tabs, Drawer, Stack) respetando las restricciones de arquitectura de la aplicación.
Prompt: "listo ya cree un repo y puse el gitignore"
Resumen de la respuesta: Se generaron 4 archivos de navegación modularizados: `AuthTabs.js` (para el registro de 3 pasos), `TripStack.js` (para el flujo del viaje), `MainDrawer.js` (para el menú principal) y `AppNavigator.js` (como orquestador raíz basado en el estado de autenticación).
Qué se usó / modificó / descartó: [Explica qué código copiaste tal cual, qué ajustaste para tu proyecto y qué decidiste no usar]
Archivos y commit: [Rutas afectadas, ej: src/navigation/*.js] / [Hash del commit, ej: a1b2c3d]
Verificación: [Cómo comprobaste que funcionaba. Ej: Ejecución en emulador, cambio del estado `isAuthenticated` manualmente para verificar renderizado condicional]
Aprendizaje: [Qué entendiste de la solución dada y qué harías distinto]

### Entrada #3

Fecha: 2026-10-23
Integrante: Tamiro José Solano Muriel
Herramienta: Gemini
Objetivo: Implementar el formulario de registro de 3 pestañas aplicando las reglas de negocio (errores inline, habilitación global del botón final y uso de estados).
Prompt: "me parece tu idea correcta"
Resumen de la respuesta: Se creó un `RegistrationContext` para compartir el estado del formulario (formData, errors) entre los Tabs usando `useState` y `useMemo`. Se implementaron las pantallas `PersonalInfoScreen` (con validación onBlur y errores debajo de los inputs) y `DocumentsScreen` (con el botón bloqueado hasta que `canSubmit` sea verdadero).
Qué se usó / modificó / descartó: [Explica qué código copiaste tal cual, qué ajustaste para tu proyecto (como crear el VehicleScreen por tu cuenta) y qué decidiste no usar]
Archivos y commit: [Rutas afectadas: src/contexts/RegistrationContext.js, src/navigation/AuthTabs.js, src/screens/auth/*.js] / [Hash del commit]
Verificación: [Cómo comprobaste que funcionaba. Ej: Probé navegando entre pestañas, dejando campos vacíos para ver los mensajes rojos, y llenando todo para habilitar el botón y entrar a la app]
Aprendizaje: [Qué entendiste de la solución dada y qué harías distinto]

### Entrada #4

Fecha: 2026-10-26
Integrante: Tamiro Jose Solano Muriel
Herramienta: Claude Code
Objetivo: Revisar el proyecto completo y corregir los bugs y problemas de configuración encontrados.
Prompt: "analiza el proyecto uberclone-driver y no modifiques nada" / "aplica esos cambios"
Resumen de la respuesta: Se conectaron las pantallas reales en `TripStack` y `MainDrawer` (antes eran mocks). Se corrigió la llamada a `calculateFare` en `TripSummaryScreen` (recibía argumentos posicionales y leía `totalFare`, que no existe). `IncomingRequestScreen` ahora llama `acceptTrip` del `TripContext`. Se quitó un texto suelto `" "` dentro de un `<View>` en `DocumentsScreen` y se agregó la validación inline de la licencia. Se sacó el efecto secundario del updater de `setState` en `useTripRequests` y se corrigió la fuga de la suscripción en `useDriverLocation`, que ahora se usa en `HomeScreen`. La disponibilidad se guarda en AsyncStorage. Se eliminaron la plantilla de Expo Router y dependencias sin uso (`expo-router`, `dotenv`, `@expo/ui`, `expo-glass-effect`, `expo-symbols`). Se agregaron `app.config.js` (API key de Google Maps), `.env.example`, `src/config/env.js` con variables `EXPO_PUBLIC_*`, un botón de cerrar sesión, la validación de correo con regex y tests de `calculateFare`.
Qué se usó / modificó / descartó: [Completar]
Archivos y commit: `src/navigation/*.js`, `src/screens/**/*.js`, `src/hooks/*.js`, `src/contexts/*.js`, `src/config/*.js`, `app.json`, `app.config.js`, `package.json`, `tsconfig.json`, `AGENTS.md`, `.env.example` / [Hash del commit]
Verificación: `npm test` (tests de `src/config/pricing.test.js`). [Completar con la prueba en el emulador/dispositivo]

### Entrada #5

- Fecha: 2026-11-01
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code
- Objetivo: Analizar el enunciado, compararlo con el código, planear las entregas y repartir el avance con Ximena.
- Prompt: "analiza el documento" / PDF del enunciado adjunto / "esto es lo que tengo pendiente y fecha de entrega 5 de noviembre, primera entrega El avance, pestaña 1 y pestaña 2 del conductor. 12 noviembre proyecto final 19 parcial final, 10 preguntas finales" / "centremonos en el avance, necesito que compares el codigo que tengo con lo que me pide el avance" / "bueno sabiendo eso puede hacer un plan de divicion de trabajo para mi y para mi compañera para ir avanzando, a parte crear un pront para esta misma herramienta para que ella pueda trabajar (debe tener todo el contexto posible para no comfundirte)" / "puedes crear las ramas de cada uno?" / "puedes modificar el nombre de las ramas con el nombre de la persona, compañera ximena"
- Resumen de la respuesta: Se comparó el código con el enunciado: de los 15 campos de las pestañas 1 y 2, 1 estaba completo, 3 a medias y 11 faltaban. Se creó un plan de reparto y un prompt para Ximena (https://claude.ai/artifact/TexYBBL9F15s31HazHvtQs), y se crearon las ramas `tamiro/registro-base`, `tamiro/pestana-1`, `ximena/pestana-2` y `ximena/readme`.
- Qué se usó / modificó / descartó: [Completar]
- Archivos y commit: Sin cambios de código; solo se crearon ramas desde a2a6c86.
- Verificación: `npm test` (5 tests) y `npx tsc --noEmit` sin errores. Paquetes confirmados en la documentación de Expo 58.
- Aprendizaje: [Completar]

### Entrada #6

- Fecha: 2026-10-23
- Integrante: Tamiro José Solano Muriel
- Herramienta: [Completar]
- Objetivo: Crear el MVP del flujo de viaje: `TripContext`, `pricing.js`, hooks de ubicación y solicitudes, y pantallas de viaje y ganancias.
- Prompt: [Completar: registro retroactivo del commit, que no tenía entrada]
- Resumen de la respuesta: [Completar]
- Qué se usó / modificó / descartó: [Completar]
- Archivos y commit: `src/config/pricing.js`, `src/contexts/TripContext.js`, `src/hooks/*.js`, `src/screens/auth/VehicleScreen.js`, `src/screens/main/EarningsScreen.js`, `src/screens/trip/*.js` — 029f6f5
- Verificación: [Completar]
- Aprendizaje: [Completar]

### Entrada #7

- Fecha: 2026-11-01
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code
- Objetivo: Crear la base común del registro para que las pestañas 1 y 2 se puedan desarrollar por separado.
- Prompt: "comencemos mi parte, ya que este chat sera compartido con ximena"
- Resumen de la respuesta: Se instalaron `expo-image-picker`, `@react-native-community/datetimepicker` y ESLint. Se crearon `FormField`, `SelectField`, `PhotoField` y los validadores de `src/validation/`. `RegistrationContext` ahora calcula los errores a partir de los datos, y las pantallas del registro se adaptaron a ese contexto.
- Qué se usó / modificó / descartó: [Completar]
- Archivos y commit: `app.json`, `eslint.config.js`, `package.json`, `package-lock.json`, `src/components/*`, `src/contexts/RegistrationContext.js`, `src/validation/*`, `src/screens/auth/*.js`, `src/screens/trip/HomeScreen.js`, `src/screens/trip/ActiveTripScreen.js`, `docs/AI_LOG.md` — db54e73
- Verificación: `npm test` pasa 8 tests y `npx tsc --noEmit` no da errores. `npx expo export --platform android` genera el bundle. ESLint solo reporta los problemas previos de `App.js`, `AuthContext.js` y `useTripRequests.js`. Tamiro probó la app y corre correctamente. `SelectField` y `PhotoField` aún no se usan en ninguna pantalla, así que no se han probado.
- Aprendizaje: [Completar]

### Entrada #8

- Fecha: 2026-11-01
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code
- Objetivo: Subir la base a GitHub, informar a Ximena del trabajo hecho y restaurar las entradas de esta bitácora que se perdieron.
- Prompt: "no documentar, hagamos este commit y dame un informe para ximena para que sepa lo que hice" / "corrigela que se elimino de la nada, y la documentacion para ximena"
- Resumen de la respuesta: Se hizo el commit de la base y se escribió un informe para Ximena, publicado en el plan del equipo. Se restauraron las entradas #5, #6 y #7 con su numeración original, se repararon las rutas alteradas en la entrada #4 y se devolvieron las marcas `AI-assisted` a esos números.
- Qué se usó / modificó / descartó: [Completar]
- Archivos y commit: `docs/AI_LOG.md`, marcas `AI-assisted` en `src/components/*`, `src/contexts/RegistrationContext.js`, `src/validation/*`, `src/screens/auth/*.js`, `src/screens/trip/HomeScreen.js`, `src/screens/trip/ActiveTripScreen.js` — db54e73 y el commit siguiente de esta rama.
- Verificación: Se comparó la entrada #4 con la versión de `main` y se revisó que cada marca del código apunte a una entrada existente.
- Aprendizaje: [Completar]
