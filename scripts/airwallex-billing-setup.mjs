// One-off setup: creates Airwallex Billing products + one-time USD prices
// for each kiosk salad and writes the mapping to kiosk/airwallex-billing-prices.json.
// Idempotent: re-running reuses products/prices matched by metadata.salad_id.
// Usage: node scripts/airwallex-billing-setup.mjs
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const BASE_URL = process.env.AIRWALLEX_API_URL || "https://api-demo.airwallex.com/api/v1";
const API_VERSION = "2026-02-27";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnvLocal();

const clientId = process.env.AIRWALLEX_BILLING_CLIENT_ID;
const apiKey = process.env.AIRWALLEX_BILLING_API_KEY;
if (!clientId || !apiKey) {
  console.error("AIRWALLEX_BILLING_CLIENT_ID / AIRWALLEX_BILLING_API_KEY not set");
  process.exit(1);
}

const SALADS = [
  { id: "rainbow-buddha", name: "Rainbow Buddha Bowl", price: 12.99 },
  { id: "mediterranean-power", name: "Mediterranean Power Salad", price: 11.99 },
  { id: "green-goddess", name: "Green Goddess Bowl", price: 13.49 },
  { id: "protein-paradise", name: "Protein Paradise", price: 15.99 },
];

const login = await fetch(`${BASE_URL}/authentication/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-client-id": clientId, "x-api-key": apiKey },
});
if (!login.ok) throw new Error(`auth failed: ${login.status}`);
const { token } = await login.json();

async function api(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-api-version": API_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const existingProducts = (await api("/products?page_size=100")).items ?? [];
const existingPrices = (await api("/prices?page_size=100")).items ?? [];

const mapping = {};
for (const salad of SALADS) {
  let product = existingProducts.find((p) => p.metadata?.salad_id === salad.id);
  if (!product) {
    product = await api("/products/create", {
      request_id: randomUUID(),
      name: salad.name,
      unit: "bowl",
      description: `HeySalad kiosk item: ${salad.name}`,
      metadata: { salad_id: salad.id },
    });
    console.log(`created product ${product.id} (${salad.name})`);
  } else {
    console.log(`reusing product ${product.id} (${salad.name})`);
  }

  let price = existingPrices.find(
    (p) => p.product_id === product.id && !p.recurring && p.currency === "USD" && p.unit_amount === salad.price
  );
  if (!price) {
    price = await api("/prices/create", {
      request_id: randomUUID(),
      product_id: product.id,
      currency: "USD",
      pricing_model: "PER_UNIT",
      unit_amount: salad.price,
      description: `One-time USD price for ${salad.name}`,
      metadata: { salad_id: salad.id },
    });
    console.log(`created price ${price.id} (${salad.name} @ $${salad.price})`);
  } else {
    console.log(`reusing price ${price.id} (${salad.name})`);
  }

  mapping[salad.id] = { product_id: product.id, price_id: price.id, unit_amount: salad.price, currency: "USD" };
}

const outPath = new URL("../kiosk/airwallex-billing-prices.json", import.meta.url);
writeFileSync(outPath, JSON.stringify({ environment: "sandbox", generated_at: new Date().toISOString(), items: mapping }, null, 2));
console.log("wrote kiosk/airwallex-billing-prices.json");
