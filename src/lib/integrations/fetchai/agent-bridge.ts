/**
 * Fetch.ai Agent Bridge
 *
 * Demonstrates how Fetch.ai uAgents could interoperate with HeySalad agents.
 *
 * Feature flag: HEYSALAD_FETCHAI_ENABLED=true
 *
 * Integration concept:
 * - Fetch.ai agents run on the Agentverse network
 * - HeySalad agents communicate via HTTP API
 * - This bridge translates between the two protocols
 *
 * Example: A Fetch.ai supplier discovery agent finds nearby food suppliers
 * and feeds results into the HeySalad marketplace.
 */

import { isEnabled } from "../types";

const AGENTVERSE_URL = process.env.FETCHAI_AGENTVERSE_URL || "https://agentverse.ai/api/v1";

function ensureEnabled() {
  if (!isEnabled("HEYSALAD_FETCHAI_ENABLED")) {
    throw new Error("Fetch.ai integration is not enabled");
  }
}

interface FetchAiMessage {
  sender: string;
  target: string;
  protocol: string;
  payload: Record<string, unknown>;
}

/**
 * Send a message to a Fetch.ai agent via Agentverse
 */
export async function sendToFetchAgent(
  targetAddress: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  ensureEnabled();

  const apiKey = process.env.FETCHAI_API_KEY;
  if (!apiKey) throw new Error("FETCHAI_API_KEY not configured");

  const res = await fetch(`${AGENTVERSE_URL}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target: targetAddress,
      payload,
    }),
  });

  if (!res.ok) throw new Error(`Fetch.ai message failed: ${res.status}`);
  return res.json();
}

/**
 * Handle an incoming message from a Fetch.ai agent
 * This would be called from a webhook endpoint
 */
export function handleFetchAgentMessage(message: FetchAiMessage) {
  ensureEnabled();

  // Route to the appropriate HeySalad agent based on protocol
  switch (message.protocol) {
    case "heysalad:supplier_discovery":
      return handleSupplierDiscovery(message.payload);
    case "heysalad:price_update":
      return handlePriceUpdate(message.payload);
    case "heysalad:delivery_status":
      return handleDeliveryStatus(message.payload);
    default:
      return { error: `Unknown protocol: ${message.protocol}` };
  }
}

function handleSupplierDiscovery(payload: Record<string, unknown>) {
  return {
    action: "supplier_found",
    suppliers: payload.suppliers || [],
    timestamp: new Date().toISOString(),
  };
}

function handlePriceUpdate(payload: Record<string, unknown>) {
  return {
    action: "price_updated",
    item: payload.item,
    newPrice: payload.price,
    currency: payload.currency || "GBP",
    timestamp: new Date().toISOString(),
  };
}

function handleDeliveryStatus(payload: Record<string, unknown>) {
  return {
    action: "delivery_updated",
    orderId: payload.orderId,
    status: payload.status,
    eta: payload.eta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Example: Register a HeySalad supplier discovery agent on Fetch.ai
 */
export async function registerSupplierDiscoveryAgent(params: {
  name: string;
  location: string;
  categories: string[];
}) {
  ensureEnabled();

  return sendToFetchAgent("agentverse:heysalad-supplier-finder", {
    action: "register",
    agent_name: params.name,
    location: params.location,
    categories: params.categories,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fetchai/webhook`,
  });
}
