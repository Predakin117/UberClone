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
| POST | `/pagos/mercadopago/vinculo` | `{}`, con el token del conductor | `{ ok: true, available, linked }` |
| POST | `/pagos/mercadopago/vincular` | `{}`, con el token del conductor | `{ ok: true, url }` |
| POST | `/pagos/mercadopago/desvincular` | `{}`, con el token del conductor | `{ ok: true }` |
| GET | `/pagos/mercadopago/oauth` | `?code=…&state=…` (lo agrega Mercado Pago) | Página HTML |

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

## Pago dividido (reto opcional de bonificación)

Si el conductor vinculó su cuenta de Mercado Pago, la preferencia se crea con **el token del conductor** y `marketplace_fee` = la comisión del viaje. Mercado Pago deja la parte del conductor en su cuenta y le pasa la comisión a la plataforma. Si no la vinculó, la plataforma cobra el viaje completo, como antes. `POST /pagos/mercadopago` responde también `split: true` o `false`.

- **Vinculación (OAuth):** `/vincular` devuelve la página de autorización de Mercado Pago, con un `state` que dura 10 minutos y se guarda en memoria. Mercado Pago vuelve a `GET /pagos/mercadopago/oauth`, y el backend cambia el código por el token del conductor (`POST /oauth/token`).
- **Tokens:** se guardan en `mercadoPagoAccounts/{uid}` con `firebase-admin`, y la app no puede leerlos. El token dura 180 días y se renueva con el `refresh_token` cuando falta menos de un día. Si Mercado Pago rechaza la renovación, se borra la vinculación.
- **Webhook:** la preferencia dividida lleva `?driver=<uid>` en el webhook, para leer el pago con el token de ese conductor. Un pago aprobado así deja `paymentSplit: true` en el viaje.
- **Variables:** `MP_CLIENT_ID`, `MP_CLIENT_SECRET` y `PUBLIC_BACKEND_URL` (https). Sin ellas, `/vinculo` responde `available: false` y `/vincular` responde 503 (`vinculo_no_configurado`).

### Cómo probarlo

1. Necesitas tres cuentas de prueba del mismo país: la **plataforma** (dueña de la aplicación), un **conductor** (vendedor) y un **comprador**.
2. Con la cuenta de la plataforma, en la aplicación copia el **Client ID** y el **Client Secret** en `MP_CLIENT_ID` y `MP_CLIENT_SECRET`. Usa su Access Token en `MP_ACCESS_TOKEN`.
3. Abre el túnel, pon la URL en `PUBLIC_BACKEND_URL` y registra en la aplicación ("URLs de redireccionamiento") la URL que el backend muestra al arrancar: `<PUBLIC_BACKEND_URL>/api/v1/pagos/mercadopago/oauth`.
4. En la app, entra a Mi perfil, toca **Vincular Mercado Pago** e inicia sesión con la cuenta de prueba del **conductor**.
5. Cobra un viaje `mercadopago` y paga con el comprador. En la cuenta del conductor debe llegar la tarifa + propina − comisión, y en la de la plataforma la comisión. En el resumen sale "Mercado Pago ya envió tu parte a tu cuenta".

## Reglas

- El código vence a los 10 minutos (`CODE_TTL_MINUTES`) y sirve una sola vez.
- Máximo 5 intentos por código y un código nuevo cada 60 segundos por correo.
- Se guarda solo el hash del código, en memoria: si el servidor se reinicia, toca pedir uno nuevo.
- El código nunca viaja en la respuesta, solo en el correo.
