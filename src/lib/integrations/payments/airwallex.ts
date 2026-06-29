import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
  WebhookResult,
  RefundResult,
} from "../types";

const BASE_URL = process.env.AIRWALLEX_API_URL || "https://api-demo.airwallex.com/api/v1";

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
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
    // Create a payment intent
    const res = await airwallexFetch("/pa/payment_intents/create", {
      method: "POST",
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        merchant_order_id: params.metadata?.orderId,
        descriptor: params.description,
        return_url: params.returnUrl,
        request_id: crypto.randomUUID(),
      }),
    });

    if (!res.ok) throw new Error(`Airwallex checkout failed: ${res.status}`);
    const data = await res.json();

    return {
      checkoutUrl: data.next_action?.url || params.returnUrl,
      sessionId: data.id,
      provider: "airwallex",
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
    const res = await airwallexFetch(`/pa/refunds/create`, {
      method: "POST",
      body: JSON.stringify({
        payment_intent_id: transactionId,
        amount,
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
