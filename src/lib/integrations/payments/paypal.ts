import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
  WebhookResult,
  RefundResult,
} from "../types";

const BASE_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function paypalFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export const paypalProvider: PaymentProvider = {
  name: "paypal",

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const res = await paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: params.amount.toFixed(2),
            },
            description: params.description,
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          brand_name: "HeySalad",
        },
      }),
    });

    if (!res.ok) throw new Error(`PayPal checkout failed: ${res.status}`);
    const order = await res.json();

    const approveLink = order.links?.find(
      (l: { rel: string }) => l.rel === "approve"
    );

    return {
      checkoutUrl: approveLink?.href || params.returnUrl,
      sessionId: order.id,
      provider: "paypal",
    };
  },

  async handleWebhook(payload: unknown, _signature: string): Promise<WebhookResult> {
    const event = payload as Record<string, unknown>;
    return {
      event: (event.event_type as string) || "unknown",
      transactionId: (event.resource as Record<string, unknown>)?.id as string,
      status: "pending",
      data: event,
    };
  },

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    const res = await paypalFetch(`/v2/payments/captures/${transactionId}/refund`, {
      method: "POST",
      body: JSON.stringify(
        amount ? { amount: { value: amount.toFixed(2), currency_code: "GBP" } } : {}
      ),
    });

    if (!res.ok) throw new Error(`PayPal refund failed: ${res.status}`);
    const data = await res.json();

    return {
      refundId: data.id,
      status: data.status === "COMPLETED" ? "succeeded" : "pending",
      amount: amount ?? 0,
      currency: "gbp",
    };
  },
};
