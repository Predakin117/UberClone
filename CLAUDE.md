@AGENTS.md
@docs/APIS.md

# UberClone Conductor — reglas del equipo

Proyecto universitario: app del conductor estilo Uber. Entrega final: 12 de
noviembre de 2026. El enunciado completo está en docs/enunciado.pdf: léelo
antes de implementar cualquier requisito y síguelo al pie de la letra
(nombres de campos, estados del viaje, fórmulas y textos).

## Equipo y Git

- Integrantes: Tamiro José Solano Muriel y Ximena Rosales Lopez.
- Nunca hagas commits en main. Cada tarea va en una rama `nombre/tarea` y
  llega a main por Pull Request que revisa el otro integrante.
- Commits pequeños, en inglés, estilo `feat:`, `fix:`, `docs:`.

## Bitácora de IA (obligatoria, la revisa la profesora)

- Todo uso de IA va en docs/AI_LOG.md con el formato de las entradas que ya
  existen: prompt copiado tal cual, resumen, qué se usó/modificó/descartó,
  archivos y hash del commit, verificación y aprendizaje.
- Tamiro numera desde #1 y Ximena desde #50. Usa el siguiente número libre
  del integrante que te habla; si no sabes quién es, pregunta.
- Nunca edites las entradas del otro integrante.
- Marca cada bloque asistido con un comentario en inglés:
  `// AI-assisted: see docs/AI_LOG.md #N`. Toda entrada citada debe existir
  antes de hacer push.

## Convenciones del código

- JavaScript (no TypeScript). Navegación con React Navigation, no Expo Router.
- Todo texto visible va en src/i18n/strings.js, en español e inglés con las
  mismas claves, y se muestra con t(). Nunca texto escrito a mano en pantalla.
- Los errores se muestran debajo del campo, nunca en un Alert.
- Las reglas de validación van en src/validation/ con sus pruebas.
- Tarifas y comisión solo en src/config/pricing.js (calculateFare), en pesos
  colombianos enteros. No dupliques fórmulas.
- Los campos y estados de trips (src/services/trips.js) siguen la sección 6
  y 3 del enunciado y son el contrato con la API del pasajero: no se
  renombran.
- AsyncStorage solo para sesión, idioma y último estado de disponibilidad.
- El registro (las 3 pestañas) ya cumple el enunciado: no lo cambies salvo
  que te lo pidan.

## Antes de dar una tarea por terminada

- npm test en la raíz y en backend/
- npx expo lint (todo el proyecto)
- npx tsc --noEmit
- Muéstrame el diff antes de cada commit.
