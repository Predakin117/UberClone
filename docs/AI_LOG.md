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
