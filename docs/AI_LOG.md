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

### Entrada #9

- Fecha: 2026-11-04
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code (Claude Opus 5.5)
- Objetivo: Completar la pestaña 1 del registro (Datos personales) con todos los campos y validaciones del enunciado, y hacer que el selector de idioma funcione.
- Prompt: "no lo documentes en la bitacora, centremonos en la pestaña 1 en todo lo que debe tener" / "hagamos la pensataña 1 como se indica" / Opción elegida en la pregunta de Claude sobre qué faltaba: "Hacer funcional el idioma (Recomendado)"
- Resumen de la respuesta: Se completaron los 8 campos de la pestaña 1 (foto de perfil, nombre, documento, celular, fecha de nacimiento, género, correo e idioma) con errores debajo de cada campo y un botón Siguiente. Se creó `DateField`, un campo de fecha reutilizable para la pestaña 3. Se agregó un `LanguageContext` que guarda el idioma en AsyncStorage y traduce los textos del registro entre español e inglés.
- Qué se usó / modificó / descartó:
  - Se usó: las reglas de `src/validation/personalInfo.js` (nombre de máximo 50 caracteres con solo letras y espacios, documento de 6 a 10 dígitos, celular de 10 dígitos, mayor de 18 años, correo con @ y dominio). También se usaron `FormField`, `SelectField` y `PhotoField` de la base común (entrada #7), `src/validation/dates.js` para guardar las fechas como `AAAA-MM-DD` en hora local y los textos en `src/i18n/strings.js`.
  - Se modificó: los validadores de la pestaña 1 ahora devuelven claves de traducción en lugar de textos fijos. `PhotoField`, `SelectField` y los títulos de las pestañas (`AuthTabs`) usan `t()`.
  - Se descartó: las librerías `i18n-js` y `expo-localization`, que se reemplazaron por una función propia sin dependencias nuevas. También se descartó el `onChange` del selector de fecha, que está obsoleto en la versión 9.2.1, y se usaron `onValueChange` y `onDismiss`. Los nombres con guion (Ana-María) se rechazan porque el enunciado pide solo letras y espacios. La pestaña 2 no se tradujo porque es de Ximena.
- Archivos y commit:
  - `src/validation/dates.js` y `src/validation/dates.test.js` — 0ee3f95
  - `App.js`, `src/components/DateField.js`, `src/components/PhotoField.js`, `src/components/SelectField.js`, `src/contexts/LanguageContext.js`, `src/i18n/strings.js`, `src/i18n/strings.test.js`, `src/navigation/AuthTabs.js`, `src/screens/auth/PersonalInfoScreen.js`, `src/validation/personalInfo.js` y `src/validation/personalInfo.test.js` — 7fbfbd4
  - `docs/AI_LOG.md` — el commit siguiente
- Verificación:
  - En `tamiro/pestana-1`: `npx jest` pasa 29 tests, entre ellos la mayoría de edad (quien cumple 18 hoy pasa y quien los cumple mañana no) y que cada error tenga traducción en los dos idiomas. `npx tsc --noEmit` no da errores, `npx expo export --platform android` genera el bundle y ESLint solo reporta los 2 errores previos de `AuthContext.js` y `useTripRequests.js`.
  - Junto con `ximena/pestana-2`: las dos ramas se mezclan sin conflictos de código y pasan 38 tests.
  - [Pendiente: la prueba en el celular de los errores al tocar Siguiente con todo vacío, la cámara y la galería, el calendario que no deja elegir menores y el idioma guardado al cerrar y abrir la app]
- Aprendizaje: [Completar]

### Entrada #10

- Fecha: 2026-11-09
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code
- Objetivo: Guardar las pestañas 1 y 2 del registro en Firestore y subir las fotos a Cloudinary.
- Prompt: [Completar: prompts de la sesión, copiados tal como se escribieron]
- Resumen de la respuesta: Se conectó la app a Firebase con el SDK web, con sesión anónima guardada en AsyncStorage. Cada pestaña se guarda en el documento `drivers/{uid}` al tocar Siguiente, las fotos se suben a Cloudinary con un upload preset sin firma y "Enviar registro" deja el estado en `pending`. Las reglas de `firestore.rules` solo dejan a cada conductor leer y escribir su documento, sin poder aprobarse solo.
- Qué se usó / modificó / descartó: [Completar]
- Archivos y commit: `src/config/firebase.js`, `src/config/env.js`, `src/services/driverRepository.js`, `src/services/driverDocs.js`, `src/services/driverDocs.test.js`, `src/services/cloudinary.js`, `src/components/NextButton.js`, `src/contexts/RegistrationContext.js`, `src/screens/auth/*.js`, `src/i18n/strings.js`, `firestore.rules`, `.env.example`, `package.json`, `package-lock.json` — f03905c y ac07030 (Pull Request #6)
- Verificación: [Completar]
- Aprendizaje: [Completar]

### Entrada #11

- Fecha: 2026-11-10
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude (Cowork)
- Objetivo: Crear el backend que envía un código de 6 dígitos al correo del conductor y el servicio de la app que lo pide y lo verifica.
- Prompt: [Completar: prompts de la sesión de Cowork, copiados tal como se escribieron]
- Resumen de la respuesta: Se creó `backend/` con Node puro (http y crypto) y Nodemailer con Gmail. Las rutas `POST /api/v1/auth/enviar-codigo` y `POST /api/v1/auth/verificar-codigo` guardan el código cifrado con sal, vencen a los 10 minutos, permiten 5 intentos y 60 segundos entre envíos, y nunca devuelven el código en la respuesta. En la app, `src/services/emailVerification.js` llama al backend sin lanzar errores.
- Qué se usó / modificó / descartó:
  - Se usó: el backend y el servicio tal como se generaron.
  - Se modificó: el trabajo se movió a la rama `tamiro/codigo-verificacion` desde `main`, porque estaba sin commit encima de `tamiro/firestore`, y las marcas de IA pasaron de #52 a #11 porque la #52 ya era la pantalla de login de Ximena.
  - Se descartó: Express; el backend usa solo módulos de Node.
- Archivos y commit: `backend/*`, `src/services/emailVerification.js`, `src/services/emailVerification.test.js`, `package.json`, `eslint.config.js` — 00cbadf (Pull Request #8); `backend/package-lock.json` — a9649e9
- Verificación: `node --test` en `backend` pasa 13 pruebas y Jest pasa las 4 del servicio. El envío real se probó junto con la entrada #13.
- Aprendizaje: [Completar]

### Entrada #12

- Fecha: 2026-11-10
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code (Claude Opus 5.5)
- Objetivo: Completar la pestaña 3 del registro (Documentos y pagos) con los campos y las validaciones del enunciado.
- Prompt: "hagamos la pestaña 3"
- Resumen de la respuesta: Se agregaron la licencia (número, foto y vencimiento), el SOAT (foto y vencimiento), la revisión técnico-mecánica (solo si el vehículo tiene 5 años o más), el correo de Mercado Pago y la casilla de términos con la comisión del 20 % visible. Los vencimientos deben ser posteriores a hoy, los errores salen debajo de cada campo en español e inglés, y el guardado sube hasta tres fotos a la vez a Cloudinary.
- Qué se usó / modificó / descartó:
  - Se usó: los componentes de la base (`PhotoField`, `DateField`, `NextButton`) y un `CheckboxField` nuevo.
  - Se modificó: `driverRepository` sube varias fotos por pestaña, y `COMMISSION_RATE` pasó a ser una constante exportada de `pricing.js` para mostrarla en los términos.
  - Se descartó: hacer la pestaña 3 como un formulario aparte; usa el mismo `RegistrationContext` que las pestañas 1 y 2.
- Archivos y commit: `src/screens/auth/DocumentsScreen.js`, `src/components/CheckboxField.js`, `src/components/DateField.js`, `src/validation/documents.js`, `src/validation/documents.test.js`, `src/validation/dates.js`, `src/validation/dates.test.js`, `src/services/driverDocs.js`, `src/services/driverDocs.test.js`, `src/services/driverRepository.js`, `src/contexts/RegistrationContext.js`, `src/i18n/strings.js`, `src/i18n/strings.test.js`, `src/config/pricing.js` — defd95f (Pull Request #7)
- Verificación: Jest pasa 73 pruebas, `npx tsc --noEmit` no da errores y `npx expo export --platform android` genera el bundle. En el celular se probaron los vencimientos desde mañana, la revisión técnico-mecánica según el año, la casilla de términos y el envío con estado `pending` en Firestore. Las fuentes no coinciden en si la primera revisión es al quinto o al sexto año (Sentencia C-745/12 y un documento del RUNT de 2023); se usó 5 en la constante `TECH_REVIEW_FIRST_YEAR`, pendiente de confirmar con la profesora.
- Aprendizaje: [Completar]

### Entrada #13

- Fecha: 2026-11-10
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code (Claude Opus 5.5)
- Objetivo: Confirmar con un código enviado al correo que el correo del conductor es suyo antes de enviar el registro.
- Prompt: "puedes crear una pestaña que sea de confirmaciond e codigo de cuenta que se le manda al correo de la persona"
- Resumen de la respuesta: Se creó la pantalla "Confirmar correo", que se abre al tocar "Enviar registro" en la pestaña 3. El conductor pide el código, lo escribe y, solo si es correcto, el registro se guarda como `pending`. Tiene reenvío con cuenta regresiva de 60 segundos, errores traducidos según el `codigoError` del backend y reintento del guardado sin pedir otro código.
- Qué se usó / modificó / descartó:
  - Se usó: el backend y el servicio de la entrada #11, y un hook nuevo `useEmailVerification` con limpieza del temporizador en `useEffect`.
  - Se modificó: `AuthTabs` pasó a ser una pila con las pestañas y la pantalla de confirmación dentro del mismo `RegistrationProvider`.
  - Se descartó: hacerla una cuarta pestaña, porque se podría abrir antes de llenar las otras tres y pedir el código sin tener todo listo.
- Archivos y commit: `src/screens/auth/VerifyEmailScreen.js`, `src/hooks/useEmailVerification.js`, `src/services/verificationErrors.js`, `src/services/verificationErrors.test.js`, `src/navigation/AuthTabs.js`, `src/screens/auth/DocumentsScreen.js`, `src/components/NextButton.js`, `src/i18n/strings.js`, `src/i18n/strings.test.js` — 8c595ba (Pull Request #9)
- Verificación: Jest pasa 77 pruebas, `npx tsc --noEmit` no da errores y el bundle de Android se genera. En el celular, el primer envío falló porque Gmail rechazó la contraseña de aplicación (error 535); con una contraseña nueva y el backend reiniciado, el código llegó al correo y la confirmación funcionó.
- Aprendizaje: [Completar]

### Entrada #14

- Fecha: 2026-11-10
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code (Claude Opus 5.5)
- Objetivo: Unir el login con cuentas de Ximena (`ximena/login-auth`) con la confirmación del correo que ya estaba en `main`, y que las dos partes funcionen juntas.
- Prompt: "como podemos solucionarlo" / "necesito que el commit de mi compañera se fusionen que funcionen correctamente mi parte y la parte de ella"
- Resumen de la respuesta: Se creó la rama `tamiro/integrar-login-auth` desde la de Ximena y se le trajo `main`. Se resolvieron 4 conflictos conservando lo de los dos: `AuthTabs` recibe la cuenta del login y mantiene la pantalla de confirmación, `NextButton` queda con un solo nombre para el texto de carga (`loadingLabel`), y `DocumentsScreen` y `strings.js` unen los cambios de ambos. Se revisó que el registro use el mismo usuario de Firebase que crea el login.
- Qué se usó / modificó / descartó:
  - Se usó: el trabajo de Ximena completo y el de `main`.
  - Se modificó: la pantalla de confirmación usa `loadingLabel` en vez de `busyLabel`, y oculta "Cambiar el correo" cuando el correo viene de la cuenta, porque en la pestaña 1 está bloqueado.
  - Se descartó: modificar la rama de Ximena directamente, por si tenía trabajo sin subir.
- Archivos y commit: `src/navigation/AuthTabs.js`, `src/components/NextButton.js`, `src/screens/auth/DocumentsScreen.js`, `src/screens/auth/VerifyEmailScreen.js`, `src/i18n/strings.js` — 5a673ec y d7d932e (Pull Request #10)
- Verificación: Jest pasa 119 pruebas, las 13 del backend pasan, `npx tsc --noEmit` no da errores, el bundle de Android se genera y no quedaron marcas de conflicto. En la consola de Firebase se activaron los proveedores Correo electrónico/contraseña y Anónimo, y se publicaron las reglas. [Completar con la prueba del flujo completo en el celular]
- Aprendizaje: [Completar]

### Entrada #15

- Fecha: 2026-11-11
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code (Claude Opus 5.5)
- Objetivo: Que la tarifa use exactamente las reglas y los valores de la sección 5 del enunciado.
- Prompt: "1. Arreglar la tarifa (filas 67, 68 y 71) · 30 min Es lo más fácil de verificar para la profe: mete el ejemplo del PDF y mira si da 19.200 y 26.900. Además, el pago, el historial y las ganancias usan esta función, así que si queda mal, todo lo que viene después sale mal. 2. Llenar los huecos de la bitácora (fila 96) · 45 min Las entradas #10 a #14 y #54 que el código cita y no existen. Es riesgo académico puro: el PDF dice que no declarar el uso de IA es falta de honestidad. No es código, pero puede costar más que cualquier pantalla. 3. Bloquear Disponible si no está aprobado (fila 14) · 15 min Un if en HomeScreen. Cumple un requisito del registro y se ve bonito en el video: “lo apruebo en la consola y ahora sí me deja conectarme”."
- Resumen de la respuesta: `calculateFare` usa tarifa base de 3.500, 1.200 por km, 250 por minuto, mínimo de 6.000 y multiplicadores 1,0, 1,4 y 1,8 para Económico, XL y Premium. Redondea al múltiplo de 100 antes de la comisión del 20 %, maneja pesos enteros y rechaza categorías desconocidas.
- Qué se usó / modificó / descartó:
  - Se usó: el ejemplo del enunciado (8,5 km y 22 minutos) como prueba.
  - Se modificó: el simulador de `EarningsScreen` usa la categoría `economy` en vez de `standard`.
  - Se descartó: seguir usando Económico cuando llega una categoría desconocida, porque escondía errores; ahora la función lanza un error.
- Archivos y commit: `src/config/pricing.js`, `src/config/pricing.test.js`, `src/screens/main/EarningsScreen.js` — 63e3bcc
- Verificación: Jest da el ejemplo del enunciado: Económico 19.200 (comisión 3.840, neto 15.360) y XL 26.900 (comisión 5.380, neto 21.520).
- Aprendizaje: [Completar]

### Entrada #16

- Fecha: 2026-11-11
- Integrante: Tamiro José Solano Muriel
- Herramienta: Claude Code (Claude Opus 5.5)
- Objetivo: Que el conductor no pueda ponerse Disponible hasta que su registro esté aprobado (sección 2 del enunciado).
- Prompt: el mismo de la entrada #15 (punto 3).
- Resumen de la respuesta: Un hook nuevo, `useDriverStatus`, escucha en tiempo real el campo `status` de `drivers/{uid}` con `onSnapshot` y deja de escucharlo al salir de la pantalla. `HomeScreen` solo habilita el interruptor cuando el estado es `approved` y muestra por qué no se puede conectar: pendiente, rechazado, verificando o sin conexión.
- Qué se usó / modificó / descartó:
  - Se usó: `onSnapshot` de Firestore, que también cubre parte del tiempo real que pide la sección 7.
  - Se modificó: el rastreo de ubicación solo corre si el conductor está conectado y aprobado.
  - Se descartó: revisar el estado guardado en el celular al iniciar sesión, porque no se entera cuando se aprueba la cuenta en la consola.
- Archivos y commit: `src/hooks/useDriverStatus.js`, `src/services/driverStatus.js`, `src/services/driverStatus.test.js`, `src/screens/trip/HomeScreen.js`, `src/i18n/strings.js` — 52a0683
- Verificación: Jest pasa 126 pruebas, `npx tsc --noEmit` no da errores y el bundle de Android se genera. [Completar con la prueba en el celular: con el estado `pending` el interruptor está bloqueado y, al cambiarlo a `approved` en la consola, se habilita sin reiniciar la app]
- Aprendizaje: [Completar]

### Entrada #50

- Fecha: 2026-11-03
- Integrante: Ximena Rosales Lopez
- Herramienta: Claude Code
- Objetivo: Completar la pestaña 2 del registro (Vehículo) con todos los campos y validaciones del enunciado.
- Prompt: "voy a empezar hacer la pestaña 2"
- Resumen de la respuesta: Se basó la rama `ximena/pestana-2` en `tamiro/registro-base` (fast-forward). Se reemplazó la versión temporal de `src/validation/vehicle.js` por las reglas completas: categoría (Económico, XL, Premium), placa `ABC123` convertida a mayúsculas, marca y modelo de máximo 30 caracteres, año de 4 dígitos no mayor al actual, color, capacidad (mínimo 6 para XL) y foto obligatoria. `VehicleScreen` usa `FormField`, `SelectField` y `PhotoField`, y tiene un botón Siguiente que muestra los errores pendientes antes de pasar a Documentos.
- Qué se usó / modificó / descartó: Librerías y herramientas de desarrollo: Jest para pruebas unitarias (vehicle.test.js), npx tsc --noEmit para verificación de tipos y npx expo lint para control de calidad de código. Componentes de interfaz reutilizables: FormField, SelectField y PhotoField dentro de VehicleScreen.js. Control de versiones: Rama ximena/pestana-2 basada en tamiro/registro-base. Se modificó:

-src/validation/vehicle.js: Reemplazo del prototipo temporal por las reglas de negocio definitivas (categorías Económico, XL, Premium; transformación automática de placa a mayúsculas con formato ABC123; restricciones de caracteres en marca y modelo; validación de año de 4 dígitos; capacidad mínima de 6 pasajeros para categoría XL; y obligatoriedad de la foto).

-src/validation/vehicle.test.js: Incorporación de 9 nuevos casos de prueba unitaria.

-src/screens/auth/VehicleScreen.js: Integración de los campos de entrada, lógica de manejo de errores pendientes al presionar "Siguiente" y manejo del estado de la foto (cámara/galería).

Se descartó: La versión mock o preliminar de validación de vehículos que se encontraba inicialmente en el repositorio base.

- Archivos y commit: `src/validation/vehicle.js`, `src/validation/vehicle.test.js`, `src/screens/auth/VehicleScreen.js`, `docs/AI_LOG.md` — 7af215d (código), a3aa039 (bitácora) y el commit siguiente (correcciones)
- Verificación: `npx jest` pasa 17 tests (9 nuevos en `vehicle.test.js`), `npx tsc --noEmit` no da errores y `npx expo lint` no reporta errores en los archivos de la pestaña. [Pendiente la prueba en el emulador: errores al tocar Siguiente con todo vacío, XL con capacidad 4, abc123 se ve como ABC123, foto con cámara y galería, teclado sin tapar campos y datos que se conservan al cambiar de pestaña]
- Aprendizaje: Mantener la lógica de negocio y las reglas estrictas de validación aisladas en un archivo dedicado (vehicle.js) junto con su respectiva suite de pruebas unitarias facilita detectar fallos lógicos antes de tocar la interfaz visual.

### Entrada #51

- Fecha: 2026-11-03
- Integrante: Ximena Rosales Lopez
- Herramienta: Claude Code
- Objetivo: Reescribir el `README.md`, que seguía siendo la plantilla de Expo, con lo que pide el enunciado para la entrega.
- Prompt: "si, dejemos todo losto pprfavor"
- Resumen de la respuesta: Se trajo `main` a la rama `ximena/readme` y se reescribió el `README.md` con la descripción de la app, el alcance del avance, las tecnologías, la instalación, las variables de entorno según `.env.example` (sin valores), los scripts, la estructura de carpetas, el flujo de ramas y la sección "Uso de IA" con el enlace a la bitácora.
- Qué se usó / modificó / descartó: Se usó:

Estándares de documentación técnica y lineamientos del enunciado de la entrega para estructurar la información del proyecto de manera clara y profesional.

Referencia directa del archivo .env.example y el package.json para documentar con exactitud las variables de entorno y los scripts de ejecución.

Control de versiones: Rama ximena/readme con sincronización previa de main.

Se modificó:

README.md: Reemplazo completo de la plantilla predeterminada de Expo por la documentación oficial del proyecto (descripción, tecnologías, instalación, configuración de entorno, scripts, estructura, flujo de ramas y bitácora de IA).

docs/AI_LOG.md: Registro de la bitácora correspondiente a la sesión de trabajo.

Se descartó: La plantilla genérica inicial de Expo que venía por defecto en el repositorio al clonar o inicializar la aplicación.

- Archivos y commit: `README.md`, `docs/AI_LOG.md` — e1b6d60 (README) y el commit siguiente (bitácora)
- Verificación: Se comprobó que las variables coinciden con `.env.example`, que los scripts existen en `package.json` y que las carpetas de la estructura existen en `main`. [Pendiente: revisar cómo se ve el README en GitHub]
- Aprendizaje: Importancia de la documentación desde el inicio: Mantener el README.md actualizado y alineado con la realidad técnica del repositorio (scripts reales, variables de entorno precisas y estructura de carpetas correcta) es clave no solo para cumplir con los requisitos académicos, sino también para facilitar el onboarding de cualquier colaborador en el equipo de desarrollo.

### Entrada #52

- Fecha: 2026-11-10
- Integrante: Ximena Rosales Lopez
- Herramienta: Claude Code
- Objetivo: Agregar una pantalla de inicio de sesión con número de celular antes de las pestañas del registro, con opción de cambiar el país. No está en el enunciado; es una funcionalidad adicional.
- Prompt: "Quiero hacer una pestaña inicial antes de la pestaña 1 y 2, será el inicio de sesión y aunque no este en la guia quiero hacer el inicio de seión, donde se pueda inciar sesion por numero de telefono, le de la ocpion de cambiar el pais y que pueda colocar el numero, Primero quiero hacer esa parte"
- Resumen de la respuesta: Se creó la rama `ximena/login` desde `main`. Se agregó `LoginScreen` como primera pantalla sin sesión, con un selector de país (`CountryPicker`) que muestra bandera, nombre y código, y busca por nombre en español o inglés o por código. `src/validation/phone.js` tiene 20 países con la cantidad de dígitos de sus celulares, valida el número y lo convierte a formato internacional (+573001234567). Los textos están en español e inglés en `strings.js`. Por ahora "Continuar" lleva al registro; la verificación por SMS queda para el siguiente paso.
- Qué se usó / modificó / descartó: [Completar]
- Archivos y commit: `src/validation/phone.js`, `src/validation/phone.test.js`, `src/components/CountryPicker.js`, `src/screens/auth/LoginScreen.js`, `src/navigation/AppNavigator.js`, `src/i18n/strings.js`, `docs/AI_LOG.md` — 95dd67b (código) y el commit siguiente (bitácora)
- Verificación: `npx jest` pasa 49 tests (13 nuevos en `phone.test.js`), `npx tsc --noEmit` no da errores, `npx expo lint` no reporta problemas en los archivos nuevos y `npx expo export --platform android` genera el bundle. [Pendiente la prueba en el emulador: elegir otro país y buscarlo, número con menos o más dígitos, número correcto que lleva al registro, y textos en inglés]
- Aprendizaje: 

### Entrada #53

- Fecha: 2026-11-10
- Integrante: Ximena Rosales Lopez
- Herramienta: Claude Code
- Objetivo: Cambiar el inicio de sesión a un flujo parecido al de Uber: entrar con celular o con correo, verificar en la base de datos que la cuenta exista, pedir la contraseña y ofrecer "Crear cuenta" a quien no tiene cuenta. No está en el enunciado; es una funcionalidad adicional.
- Prompt: "El flujo no es como lo esperaba porque, quiero también hacer un inciio de seison con su correo electrocnico, pero quiero que sea muy parecia a uber, cuando uno se registra, quieor que me salgan esas dos ocpiones de correo y celular, y si no tienes cuenta también esta la opción de crear cuenta, pero que se verifica si el correo o celular esta en la base de datos que lo djee ingresar"
- Resumen de la respuesta: La IA advirtió que dejar entrar solo porque el correo o el celular existe permitiría entrar a la cuenta de otro conductor, y se eligió usar contraseña con Firebase Auth y un proyecto de Firebase propio, en la rama `ximena/login-auth`. Se instaló `firebase` 13.2.0 y se copiaron sin cambios `firebase.js`, `env.js` y `.env.example` de `tamiro/firestore`. `LoginScreen` tiene el selector Celular | Correo y busca la cuenta en la colección `loginIndex`; `LoginPasswordScreen` pide la contraseña y permite restablecerla por correo; `CreateAccountScreen` crea la cuenta con correo, celular y contraseña. `firestore.rules` agrega reglas que dejan consultar un correo o celular exacto sin poder listar los datos de los demás. Cerrar sesión también cierra la sesión de Firebase.
- Qué se usó / modificó / descartó:
  - Se usó: Firebase Auth con correo y contraseña (la sesión queda guardada con AsyncStorage) y Firestore con dos colecciones nuevas: `loginIndex` (un documento por correo y por celular que apunta a la cuenta) y `accounts` (correo y celular de cada cuenta). Los tres documentos de una cuenta nueva se guardan juntos con `writeBatch`, y si falla el guardado se borra el usuario recién creado. También se usaron sin cambios `firebase.js`, `env.js` y `.env.example` de la rama `tamiro/firestore`, el selector de país y las reglas de celular de la entrada #52, `FormField` y `formStyles` de la base común, y los textos en español e inglés de `strings.js`.
  - Se modificó: `LoginScreen` pasó de pedir solo el celular a tener el selector Celular | Correo y buscar la cuenta antes de pedir la contraseña. `AppNavigator` agrega `LoginPassword` y `CreateAccount` con flecha para volver. `AuthContext` también cierra la sesión de Firebase al cerrar sesión. `firestore.rules` agrega las reglas de `loginIndex` y `accounts` a las de `drivers`. Si una cuenta anónima ya había guardado pestañas, al crear la cuenta se vincula con `linkWithCredential` para conservar su uid.
  - Se descartó: dejar entrar solo porque el correo o el celular existe en la base de datos, porque cualquiera podría entrar a la cuenta de otro conductor con su número. También se descartó usar el proyecto de Firebase de Tamiro para no tocar su base de datos (se creó el proyecto propio `uberclone-6ae65`) y permitir listar `loginIndex`, para que nadie pueda ver los correos y celulares de los demás.
- Archivos y commit: `package.json`, `package-lock.json`, `.env.example`, `firestore.rules`, `src/config/env.js`, `src/config/firebase.js`, `src/services/accountService.js`, `src/validation/account.js`, `src/validation/account.test.js`, `src/components/PhoneField.js`, `src/components/PasswordField.js`, `src/components/PrimaryButton.js`, `src/screens/auth/LoginScreen.js`, `src/screens/auth/LoginPasswordScreen.js`, `src/screens/auth/CreateAccountScreen.js`, `src/navigation/AppNavigator.js`, `src/contexts/AuthContext.js`, `src/i18n/strings.js`, `docs/AI_LOG.md` — 6256ac3 (Firebase), d3d45fd (pantallas), def417f (bitácora), f7e3a5e (hashes de la bitácora) y el commit siguiente (entrada completa)
- Verificación:
  - `npx jest` pasa 61 tests (12 nuevos en `account.test.js`), `npx tsc --noEmit` no da errores, `npx expo lint` solo reporta los 2 errores que ya existían en `AuthContext.js` y `useTripRequests.js`, y `npx expo export --platform android` genera el bundle con Firebase.
  - En el celular, el primer intento mostró "Unable to resolve module firebase/auth": el servidor de Expo se había iniciado antes de instalar `firebase`. Se resolvió reiniciándolo con `npx expo start --clear`.
  - Después, la pantalla de login abrió bien, pero al buscar un número salió "La base de datos rechazó la operación" (`permission-denied`). La app estaba usando el Firebase de Tamiro porque no existía `.env.local`, y ese proyecto no tiene las reglas de `loginIndex`. Se configuró el proyecto propio (correo/contraseña y anónimo habilitados, Firestore en modo producción, reglas de `firestore.rules` publicadas) y se creó `.env.local` con sus valores.
  - [Pendiente la prueba en el celular con el proyecto de Firebase propio: cuenta no encontrada, crear cuenta, contraseña incorrecta y correcta, correo o celular repetido, y correo para restablecer la contraseña]
- Aprendizaje: 
