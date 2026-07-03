import { KIOSK_CONFIG, KIOSK_SALADS } from "./catalog";

const DEFAULT_HUMAN_PAY_BASE = "https://app.anyway.sh/pay";
const DEFAULT_AGENT_PAY_BASE = "https://app-prod.anyway.sh/v1/pay/agent";
const DEFAULT_CONFIRM_BASE = "https://app-prod.anyway.sh/v1/pay";

export type AnywayKioskCheckoutConfig = {
  paymentLinkId: string;
  paymentLinkUrl: string;
  agentPayUrl: string;
  confirmUrl: string;
};

type AnywayCheckoutArgs = {
  orderId: string;
  amount: number;
  itemCount: number;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function extractPaymentLinkId(value?: string | null) {
  if (!value) return null;
  const explicitMatch = value.match(/\bPL[0-9A-Z]+\b/i);
  if (explicitMatch?.[0]) return explicitMatch[0].toUpperCase();

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.find((part) => /^PL[0-9A-Z]+$/i.test(part))?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

export function getPublicAppUrl() {
  return trimTrailingSlash(
    (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "https://kiosk-beta.heysalad.ai"
    ).trim(),
  );
}

export function getAnywayKioskCheckoutConfig(): AnywayKioskCheckoutConfig | null {
  const configuredLink =
    process.env.ANYWAY_KIOSK_PAYMENT_LINK_ID ||
    process.env.ANYWAY_KIOSK_PAYMENT_LINK_URL ||
    process.env.ANYWAY_KIOSK_AGENT_PAY_URL;
  const paymentLinkId = extractPaymentLinkId(configuredLink);

  if (!paymentLinkId) return null;

  const humanPayBase = trimTrailingSlash(process.env.ANYWAY_HUMAN_PAY_BASE || DEFAULT_HUMAN_PAY_BASE);
  const agentPayBase = trimTrailingSlash(process.env.ANYWAY_AGENT_PAY_BASE || DEFAULT_AGENT_PAY_BASE);
  const confirmBase = trimTrailingSlash(process.env.ANYWAY_CONFIRM_PAY_BASE || DEFAULT_CONFIRM_BASE);

  return {
    paymentLinkId,
    paymentLinkUrl: process.env.ANYWAY_KIOSK_PAYMENT_LINK_URL || `${humanPayBase}/${paymentLinkId}`,
    agentPayUrl: process.env.ANYWAY_KIOSK_AGENT_PAY_URL || `${agentPayBase}/${paymentLinkId}`,
    confirmUrl: `${confirmBase}/${paymentLinkId}/confirm`,
  };
}

export function isAnywayKioskCheckoutConfigured() {
  return Boolean(getAnywayKioskCheckoutConfig());
}

export function buildAnywayAgentPayment(config: AnywayKioskCheckoutConfig, args: AnywayCheckoutArgs) {
  return {
    protocol: "anyway-agent-pay",
    network: "Base",
    asset: "USDC",
    currency: "USDC",
    amount: Number(args.amount.toFixed(2)),
    merchantReference: args.orderId,
    itemCount: args.itemCount,
    paymentLinkId: config.paymentLinkId,
    instructionsUrl: config.agentPayUrl,
    confirmUrl: config.confirmUrl,
    note: `${KIOSK_CONFIG.name} order ${args.orderId}`,
  };
}

export function buildKioskAgentOffer(appUrl = getPublicAppUrl()) {
  const anyway = getAnywayKioskCheckoutConfig();

  return {
    id: KIOSK_CONFIG.slug,
    name: KIOSK_CONFIG.name,
    location: KIOSK_CONFIG.location,
    version: "2026-07-03",
    checkoutEndpoint: `${appUrl}/api/kiosk/checkout`,
    supportedProviders: anyway ? ["airwallex", "anyway"] : ["airwallex"],
    menu: KIOSK_SALADS.map((salad) => ({
      id: salad.id,
      name: salad.name,
      price: salad.price,
      currency: "USD",
      dietary: salad.dietary,
      calories: salad.calories,
      protein: salad.protein,
      ingredients: salad.ingredients,
    })),
    anyway: anyway
      ? {
          paymentLinkId: anyway.paymentLinkId,
          humanCheckoutUrl: anyway.paymentLinkUrl,
          agentInstructionsUrl: anyway.agentPayUrl,
          settlement: {
            network: "Base",
            asset: "USDC",
          },
        }
      : null,
  };
}
