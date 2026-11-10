# Backend del código de verificación

Envía al correo del conductor un código de 6 dígitos (al terminar el registro o al iniciar sesión) y lo verifica. La app de Expo lo usa con `src/services/emailVerification.js`.

## Cómo correrlo

```bash
cd backend
npm install
cp .env.example .env   # y llenar MAIL_USER y MAIL_PASS
npm start
```

Al arrancar muestra la línea `EXPO_PUBLIC_BACKEND_API_URL=...` con la IP de tu PC: esa va en el `.env` de la raíz. El celular y el PC deben estar en el mismo WiFi. Necesita Node 20.6 o superior.

Pruebas: `npm test` (no envían correos de verdad).

## Rutas (`/api/v1`)

| Método | Ruta | Cuerpo | Respuesta OK |
| --- | --- | --- | --- |
| POST | `/auth/enviar-codigo` | `{ email, nombre?, motivo: "registro" \| "login", dispositivo? }` | `{ ok: true, minutos }` |
| POST | `/auth/verificar-codigo` | `{ email, codigo }` | `{ ok: true }` |
| GET | `/health` | — | `{ ok: true }` |

Los errores responden `{ ok: false, codigoError, error }`. Valores de `codigoError`: `email_invalido`, `motivo_invalido`, `espera` (debe esperar 60 s para pedir otro; trae `reintentarEn`), `correo_no_enviado`, `codigo_invalido`, `sin_codigo`, `vencido`, `codigo_incorrecto` (trae `intentosRestantes`) y `demasiados_intentos`.

## Reglas

- El código vence a los 10 minutos (`CODE_TTL_MINUTES`) y sirve una sola vez.
- Máximo 5 intentos por código y un código nuevo cada 60 segundos por correo.
- Se guarda solo el hash del código, en memoria: si el servidor se reinicia, toca pedir uno nuevo.
- El código nunca viaja en la respuesta, solo en el correo.
