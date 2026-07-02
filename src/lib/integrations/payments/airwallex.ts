import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
  WebhookResult,
  RefundResult,
} from "../types";

const BASE_URL = (process.env.AIRWALLEX_API_URL || "https://api.airwallex.com/api/v1").trim();

function getAirwallexCredentials() {
  const clientId = process.env.AIRWALLEX_CLIENT_ID?.trim();
  const apiKey = process.env.AIRWALLEX_API_KEY?.trim();

  if (!clientId || !apiKey) {
    throw new Error("AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY must be configured");
  }

  return { clientId, apiKey };
}

async function getAuthToken(): Promise<string> {
  const { clientId, apiKey } = getAirwallexCredentials();
  const res = await fetch(`${BASE_URL}/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });
  if (!res.ok) throw new Error(`Airwallex auth failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function airwallexFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export const airwallexProvider: PaymentProvider = {
  name: "airwallex",

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const currency = params.currency.toUpperCase();
    const requestId = crypto.randomUUID();
    // Leave payment methods unrestricted so Airwallex can surface every
    // activated method eligible for the transaction context.
    const res = await airwallexFetch("/pa/payment_intents/create", {
      method: "POST",
      body: JSON.stringify({
        amount: params.amount,
        currency,
        merchant_order_id: params.metadata?.orderId,
        descriptor: params.description,
        request_id: requestId,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Airwallex payment intent failed (${res.status}): ${errText}`);
    }
    const data = await res.json();

    // Build the Airwallex hosted payment page URL
    const env = BASE_URL.includes("demo") ? "demo" : "prod";
    const checkoutUrl =
      `https://checkout.airwallex.com/?intent_id=${data.id}` +
      `&client_secret=${data.client_secret}` +
      `&environment=${env}` +
      (params.returnUrl ? `&successUrl=${encodeURIComponent(params.returnUrl)}` : "");

    return {
      checkoutUrl,
      sessionId: data.id,
      provider: "airwallex",
      intentId: data.id,
      clientSecret: data.client_secret,
    };
  },

  async handleWebhook(_payload: unknown, _signature: string): Promise<WebhookResult> {
    // Airwallex webhook verification would go here
    const event = _payload as Record<string, unknown>;
    return {
      event: (event.name as string) || "unknown",
      transactionId: event.id as string,
      status: "pending",
      data: event,
    };
  },

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    const refundAmount = typeof amount === "number" ? Number(amount.toFixed(2)) : undefined;
    const res = await airwallexFetch(`/pa/refunds/create`, {
      method: "POST",
      body: JSON.stringify({
        payment_intent_id: transactionId,
        amount: refundAmount,
        request_id: crypto.randomUUID(),
        reason: "requested_by_customer",
      }),
    });

    if (!res.ok) throw new Error(`Airwallex refund failed: ${res.status}`);
    const data = await res.json();

    return {
      refundId: data.id,
      status: data.status === "SUCCEEDED" ? "succeeded" : "pending",
      amount: data.amount ?? 0,
      currency: data.currency ?? "gbp",
    };
  },
};
