// AI-assisted: see docs/AI_LOG.md #62
// Mercado Pago Checkout Pro client (section 4 of the assignment). It is the
// only file that talks to the Mercado Pago API (docs/APIS.md), with the
// built-in fetch of Node: no SDK is installed. The access token
// (MP_ACCESS_TOKEN, a test credential) only lives in backend/.env.
//
// publicUrl is PUBLIC_BACKEND_URL (the Cloudflare tunnel, https). With it,
// Mercado Pago sends the webhook and returns the passenger to the backend
// after paying. Without it, the payment still works: the app asks the backend
// to check the payment when the checkout closes.

const MP_API = "https://api.mercadopago.com";
const TIMEOUT_MS = 15_000;

// The error keeps the HTTP status of Mercado Pago, for the logs
class MercadoPagoError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function createMercadoPago({ accessToken, publicUrl = "", fetchFn = fetch }) {
  const base = publicUrl.replace(/\/+$/, "");

  async function request(method, path, body) {
    const response = await fetchFn(`${MP_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new MercadoPagoError(
        data.message || `Mercado Pago answered ${response.status}`,
        response.status,
      );
    }
    return data;
  }

  /**
   * Creates the Checkout Pro preference of a trip: one item with the amount
   * the passenger pays (fare + tip, integer COP), external_reference = tripId.
   * Returns { preferenceId, url }: url is the checkout the app opens.
   */
  async function createPreference({ tripId, amount, title }) {
    const preference = {
      items: [
        {
          id: tripId,
          title,
          quantity: 1,
          currency_id: "COP",
          unit_price: amount,
        },
      ],
      external_reference: tripId,
      // Only cards and the like: the cash option of the trip is a different flow
      payment_methods: { excluded_payment_types: [{ id: "ticket" }] },
    };
    if (base.startsWith("https://")) {
      const returnUrl = `${base}/api/v1/pagos/mercadopago/retorno`;
      preference.notification_url = `${base}/api/v1/pagos/mercadopago/webhook`;
      preference.back_urls = {
        success: returnUrl,
        failure: returnUrl,
        pending: returnUrl,
      };
      preference.auto_return = "approved";
    }
    const created = await request("POST", "/checkout/preferences", preference);
    return { preferenceId: created.id, url: created.init_point };
  }

  // One payment by its id: { id, status, external_reference, transaction_amount, currency_id… }
  const getPayment = (paymentId) =>
    request("GET", `/v1/payments/${encodeURIComponent(paymentId)}`);

  // The payments of a trip, newest first (for when there was no webhook)
  async function findTripPayments(tripId) {
    const params = new URLSearchParams({
      external_reference: tripId,
      sort: "date_created",
      criteria: "desc",
    });
    const data = await request("GET", `/v1/payments/search?${params}`);
    return data.results ?? [];
  }

  return { createPreference, getPayment, findTripPayments };
}

module.exports = { createMercadoPago, MercadoPagoError };
