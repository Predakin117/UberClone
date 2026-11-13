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
| POST | `/pagos/efectivo` | `{ tripId }`, con `Authorization: Bearer <token de Firebase del conductor>` | `{ ok: true }` |
| POST | `/pagos/mercadopago` | `{ tripId, amount }`, con el token del conductor | `{ ok: true, url }` |
| POST | `/pagos/mercadopago/verificar` | `{ tripId }`, con el token del conductor | `{ ok: true, paymentStatus }` |
| POST | `/pagos/mercadopago/webhook` | Aviso de Mercado Pago (`type`, `data.id`) | `{ ok: true }` |
| GET | `/pagos/mercadopago/retorno` | `?payment_id=…` (lo agrega Mercado Pago) | Página HTML |

Los errores responden `{ ok: false, codigoError, error }`. Valores de `codigoError`: `email_invalido`, `motivo_invalido`, `espera` (debe esperar 60 s para pedir otro; trae `reintentarEn`), `correo_no_enviado`, `codigo_invalido`, `sin_codigo`, `vencido`, `codigo_incorrecto` (trae `intentosRestantes`) y `demasiados_intentos`.

## Pago en efectivo

`POST /pagos/efectivo` verifica el token con `firebase-admin` (`verifyIdToken`) y, en una transacción, deja el viaje con `paymentStatus: "cash"` y `status: "paid"` solo si está `completed`, es de ese conductor y su `paymentMethod` es `cash`. Si ya estaba pagado en efectivo responde `{ ok: true }` sin volver a escribir. Necesita `backend/serviceAccountKey.json`: sin ella el backend arranca igual y esta ruta responde 503 (`pagos_no_configurados`).

Valores de `codigoError`: `no_autorizado` (401), `datos_invalidos` (400), `no_encontrado` (404), `no_es_tu_viaje` (403), `metodo_invalido` y `estado_invalido` (409).

## Mercado Pago Checkout Pro (modo prueba)

Necesita `backend/serviceAccountKey.json` y `MP_ACCESS_TOKEN` en `backend/.env` (el Access Token de prueba de la cuenta de prueba del vendedor). Sin ellos, las rutas responden 503 (`pagos_no_configurados`).

- `POST /pagos/mercadopago` revisa que el viaje sea del conductor, esté `completed`, sea `mercadopago` y que `amount` sea la tarifa más la propina. Después crea la preferencia con `external_reference = tripId` y responde la `url` del checkout.
- El pago siempre se lee de Mercado Pago (`GET /v1/payments/...`), nunca del aviso. Si está aprobado, en COP y por el monto del viaje, el viaje queda con `paymentStatus: "approved"`, `paymentId` y `status: "paid"`. Si está rechazado queda `rejected`, y si está en proceso, `pending`.
- Con `PUBLIC_BACKEND_URL` (el túnel https, sin `/api/v1`), la preferencia lleva el webhook y la página de regreso. Sin él, la app llama a `/pagos/mercadopago/verificar` al volver del navegador.

Valores de `codigoError`: los del efectivo, más `monto_invalido` y `ya_pagado` (409) y `pasarela_no_disponible` (502).

### Cómo probarlo

1. En [Mercado Pago Developers](https://www.mercadopago.com.co/developers/panel/app) crea una aplicación (Checkout Pro) y dos cuentas de prueba: vendedor y comprador.
2. Inicia sesión con el vendedor de prueba y copia su Access Token de prueba en `MP_ACCESS_TOKEN`.
3. Opcional: abre el túnel (`cloudflared tunnel --url http://localhost:3000`) y pon la URL https en `PUBLIC_BACKEND_URL`. Después reinicia el backend.
4. Crea un viaje con pago `mercadopago` (`npm run simular -- economy mercadopago`), termínalo en la app y toca "Cobrar con Mercado Pago".
5. Paga con el comprador de prueba y una tarjeta de prueba. Con el titular `APRO` el pago se aprueba y con `OTHE` se rechaza.

## Reglas

- El código vence a los 10 minutos (`CODE_TTL_MINUTES`) y sirve una sola vez.
- Máximo 5 intentos por código y un código nuevo cada 60 segundos por correo.
- Se guarda solo el hash del código, en memoria: si el servidor se reinicia, toca pedir uno nuevo.
- El código nunca viaja en la respuesta, solo en el correo.
