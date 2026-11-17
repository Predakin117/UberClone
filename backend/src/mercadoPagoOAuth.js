// AI-assisted: see docs/AI_LOG.md #63
// OAuth of Mercado Pago for split payments (optional bonus of section 4):
// each driver links their own Mercado Pago account to the platform's
// application. The driver opens authorizationUrl, accepts, and Mercado Pago
// sends a code to redirectUri; the backend changes the code for the driver's
// access token. Only the backend sees the tokens (docs/APIS.md).
//
// clientId and clientSecret are the platform application's (MP_CLIENT_ID and
// MP_CLIENT_SECRET in backend/.env). redirectUri must be registered exactly
// in the application ("URLs de redireccionamiento").

const AUTH_URL = "https://auth.mercadopago.com/authorization";
const TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const TIMEOUT_MS = 15_000;

// The tokens as the backend stores them
const toAccount = (data, now) => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  userId: data.user_id == null ? null : String(data.user_id),
  publicKey: data.public_key ?? null,
  // The access token lasts expires_in seconds (180 days)
  expiresAt: now() + (Number(data.expires_in) || 0) * 1000,
});

function createMercadoPagoOAuth({
  clientId,
  clientSecret,
  redirectUri,
  fetchFn = fetch,
  now = Date.now,
}) {
  // The page where the driver accepts. state ties the answer to the driver.
  const authorizationUrl = (state) =>
    `${AUTH_URL}?${new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      platform_id: "mp",
      state,
      redirect_uri: redirectUri,
    })}`;

  async function requestToken(body) {
    const response = await fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        ...body,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      const problem = new Error(data.message || data.error || "oauth_failed");
      problem.status = response.status;
      throw problem;
    }
    return toAccount(data, now);
  }

  // The code lasts 10 minutes and works once
  const exchangeCode = (code) =>
    requestToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

  // Each refresh returns a new access token and a new refresh token
  const refresh = (refreshToken) =>
    requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });

  return { authorizationUrl, exchangeCode, refresh };
}

module.exports = { createMercadoPagoOAuth };
