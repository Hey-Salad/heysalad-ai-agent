/**
 * Airwallex Billing Checkout integration.
 *
 * Uses the Billing product surface (billing_checkouts) with a scoped
 * billing-only key — separate credentials from the payment-intent flow in
 * ./airwallex.ts. Salads map to pre-created Product/Price objects; see
 * scripts/airwallex-billing-setup.mjs and kiosk/airwallex-billing-prices.json.
 */

import priceCatalog from "@kiosk/airwallex-billing-prices.json";

const BASE_URL = process.env.AIRWALLEX_API_URL || "https://api-demo.airwallex.com/api/v1";
const API_VERSION = "2026-02-27";

type BillingCheckoutItem = { saladId: string; quantity: number };

type BillingCheckoutParams = {
  items: BillingCheckoutItem[];
  successUrl: string;
  backUrl?: string;
  metadata?: Record<string, string>;
};

export type BillingCheckoutResult = {
  checkoutUrl: string;
  checkoutId: string;
  provider: "airwallex_billing";
};

function getBillingCredentials() {
  const clientId = process.env.AIRWALLEX_BILLING_CLIENT_ID;
  const apiKey = process.env.AIRWALLEX_BILLING_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error("AIRWALLEX_BILLING_CLIENT_ID and AIRWALLEX_BILLING_API_KEY must be configured");
  }
  return { clientId, apiKey };
}

async function getAuthToken(): Promise<string> {
  const { clientId, apiKey } = getBillingCredentials();
  const res = await fetch(`${BASE_URL}/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });
  if (!res.ok) throw new Error(`Airwallex billing auth failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

export function getBillingPriceId(saladId: string): string | null {
  const entry = (priceCatalog.items as Record<string, { price_id: string }>)[saladId];
  return entry?.price_id ?? null;
}

export async function createBillingCheckout(params: BillingCheckoutParams): Promise<BillingCheckoutResult> {
  const lineItems = params.items.map((item) => {
    const priceId = getBillingPriceId(item.saladId);
    if (!priceId) throw new Error(`No Airwallex billing price configured for salad "${item.saladId}"`);
    return { price_id: priceId, quantity: item.quantity };
  });

  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/billing_checkouts/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-api-version": API_VERSION,
    },
    body: JSON.stringify({
      request_id: crypto.randomUUID(),
      mode: "PAYMENT",
      line_items: lineItems,
      success_url: params.successUrl,
      // Both IDs are mandatory because the sandbox org has multiple legal
      // entities and linked payment accounts.
      legal_entity_id: process.env.AIRWALLEX_LEGAL_ENTITY_ID,
      linked_payment_account_id: process.env.AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID,
      invoice_data: { memo: "HeySalad Kiosk order", ...(params.metadata ? { metadata: params.metadata } : {}) },
      ...(params.backUrl ? { back_url: params.backUrl } : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Airwallex billing checkout failed (${res.status}): ${JSON.stringify(data)}`);
  }
  if (!data.url) {
    throw new Error(`Airwallex billing checkout returned no URL (status: ${data.status})`);
  }

  return { checkoutUrl: data.url, checkoutId: data.id, provider: "airwallex_billing" };
}
