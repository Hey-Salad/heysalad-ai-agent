/**
 * CoralOS (Solana) Marketplace Integration
 *
 * Implements agent-to-agent coordination for the HeySalad® supply chain:
 * Restaurant Agent → Stock Agent → Supplier Agents → Escrow → Settlement
 *
 * Feature flag: HEYSALAD_CORALOS_ENABLED=true
 */

import { isEnabled, type MarketplaceAgent, type EscrowTransaction } from "../types";

// ---------------------------------------------------------------------------
// Agent Definitions
// ---------------------------------------------------------------------------

export function createBuyerAgent(businessId: string): MarketplaceAgent {
  if (!isEnabled("HEYSALAD_CORALOS_ENABLED")) {
    throw new Error("CoralOS is not enabled");
  }
  return {
    type: "buyer",
    id: `buyer-${businessId}`,
    async execute(action, params) {
      switch (action) {
        case "request_quote":
          return requestQuote(businessId, params as unknown as QuoteRequest);
        case "accept_quote":
          return acceptQuote(params.quoteId as string);
        case "confirm_delivery":
          return confirmDelivery(params.escrowId as string);
        default:
          throw new Error(`Unknown buyer action: ${action}`);
      }
    },
  };
}

export function createSupplierAgent(supplierId: string): MarketplaceAgent {
  if (!isEnabled("HEYSALAD_CORALOS_ENABLED")) {
    throw new Error("CoralOS is not enabled");
  }
  return {
    type: "supplier",
    id: `supplier-${supplierId}`,
    async execute(action, params) {
      switch (action) {
        case "submit_quote":
          return submitQuote(supplierId, params as unknown as QuoteSubmission);
        case "ship_order":
          return markShipped(params.orderId as string);
        default:
          throw new Error(`Unknown supplier action: ${action}`);
      }
    },
  };
}

export function createStockAgent(businessId: string): MarketplaceAgent {
  if (!isEnabled("HEYSALAD_CORALOS_ENABLED")) {
    throw new Error("CoralOS is not enabled");
  }
  return {
    type: "stock",
    id: `stock-${businessId}`,
    async execute(action, params) {
      switch (action) {
        case "check_levels":
          return checkStockLevels(businessId);
        case "auto_reorder":
          return autoReorder(businessId, params.items as StockItem[]);
        default:
          throw new Error(`Unknown stock action: ${action}`);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Marketplace Flow Types
// ---------------------------------------------------------------------------

interface QuoteRequest {
  items: Array<{ name: string; quantity: number; unit: string }>;
  deliveryBy: string;
  location: string;
}

interface QuoteSubmission {
  requestId: string;
  priceTotal: number;
  currency: string;
  deliveryDate: string;
  notes?: string;
}

interface StockItem {
  name: string;
  currentLevel: number;
  reorderLevel: number;
  unit: string;
}

// ---------------------------------------------------------------------------
// Marketplace Operations (demo implementations)
// ---------------------------------------------------------------------------

async function requestQuote(businessId: string, request: QuoteRequest) {
  // In production, this would broadcast to supplier agents via CoralOS messaging
  return {
    requestId: `req-${Date.now()}`,
    businessId,
    items: request.items,
    deliveryBy: request.deliveryBy,
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

async function submitQuote(supplierId: string, submission: QuoteSubmission) {
  return {
    quoteId: `quote-${Date.now()}`,
    supplierId,
    requestId: submission.requestId,
    priceTotal: submission.priceTotal,
    currency: submission.currency,
    deliveryDate: submission.deliveryDate,
    status: "submitted",
  };
}

async function acceptQuote(quoteId: string) {
  return {
    orderId: `order-${Date.now()}`,
    quoteId,
    status: "accepted",
    escrowRequired: true,
  };
}

async function confirmDelivery(escrowId: string) {
  return {
    escrowId,
    status: "delivered",
    settlementTriggered: true,
  };
}

async function markShipped(orderId: string) {
  return {
    orderId,
    status: "shipped",
    shippedAt: new Date().toISOString(),
  };
}

async function checkStockLevels(businessId: string) {
  // Demo data
  return {
    businessId,
    items: [
      { name: "Tomatoes", level: 5, unit: "kg", reorderLevel: 10, needsReorder: true },
      { name: "Olive Oil", level: 8, unit: "L", reorderLevel: 3, needsReorder: false },
      { name: "Mozzarella", level: 2, unit: "kg", reorderLevel: 5, needsReorder: true },
    ],
  };
}

async function autoReorder(businessId: string, items: StockItem[]) {
  const reorderItems = items.filter((i) => i.currentLevel <= i.reorderLevel);
  return {
    businessId,
    reorderCount: reorderItems.length,
    items: reorderItems.map((i) => ({
      name: i.name,
      quantity: i.reorderLevel * 2 - i.currentLevel,
      unit: i.unit,
    })),
    quoteRequestId: `req-${Date.now()}`,
    status: "quote_requested",
  };
}

// ---------------------------------------------------------------------------
// End-to-End Demo Flow
// ---------------------------------------------------------------------------

export async function runMarketplaceDemo(businessId: string): Promise<{
  steps: Array<{ step: string; result: unknown }>;
  escrow: EscrowTransaction;
}> {
  const buyer = createBuyerAgent(businessId);
  const stock = createStockAgent(businessId);
  const supplier1 = createSupplierAgent("supplier-fresh-farms");
  const supplier2 = createSupplierAgent("supplier-city-produce");

  const steps: Array<{ step: string; result: unknown }> = [];

  // Step 1: Stock agent checks levels
  const levels = await stock.execute("check_levels", {});
  steps.push({ step: "1. Stock Agent checks levels", result: levels });

  // Step 2: Stock agent triggers auto-reorder
  const reorder = await stock.execute("auto_reorder", {
    items: [
      { name: "Tomatoes", currentLevel: 5, reorderLevel: 10, unit: "kg" },
      { name: "Mozzarella", currentLevel: 2, reorderLevel: 5, unit: "kg" },
    ],
  });
  steps.push({ step: "2. Stock Agent auto-reorders", result: reorder });

  // Step 3: Buyer agent requests quotes
  const quoteRequest = await buyer.execute("request_quote", {
    items: [
      { name: "Tomatoes", quantity: 15, unit: "kg" },
      { name: "Mozzarella", quantity: 8, unit: "kg" },
    ],
    deliveryBy: new Date(Date.now() + 86400000).toISOString(),
    location: "London",
  });
  steps.push({ step: "3. Buyer Agent requests quotes", result: quoteRequest });

  // Step 4: Suppliers compete
  const quote1 = await supplier1.execute("submit_quote", {
    requestId: (quoteRequest as { requestId: string }).requestId,
    priceTotal: 45.0,
    currency: "GBP",
    deliveryDate: new Date(Date.now() + 43200000).toISOString(),
  });
  const quote2 = await supplier2.execute("submit_quote", {
    requestId: (quoteRequest as { requestId: string }).requestId,
    priceTotal: 52.0,
    currency: "GBP",
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
  });
  steps.push({ step: "4. Suppliers compete", result: { quote1, quote2 } });

  // Step 5: Buyer accepts best quote
  const accepted = await buyer.execute("accept_quote", {
    quoteId: (quote1 as { quoteId: string }).quoteId,
  });
  steps.push({ step: "5. Buyer accepts best quote (Fresh Farms)", result: accepted });

  // Step 6: Create Solana devnet escrow
  const escrow: EscrowTransaction = {
    id: `escrow-${Date.now()}`,
    buyer: `buyer-${businessId}`,
    supplier: "supplier-fresh-farms",
    amount: 45.0,
    status: "funded",
    network: "devnet",
  };
  steps.push({ step: "6. Solana Devnet escrow created & funded", result: escrow });

  // Step 7: Supplier ships
  const shipped = await supplier1.execute("ship_order", {
    orderId: (accepted as { orderId: string }).orderId,
  });
  steps.push({ step: "7. Supplier ships order", result: shipped });

  // Step 8: Buyer confirms delivery
  const delivered = await buyer.execute("confirm_delivery", { escrowId: escrow.id });
  steps.push({ step: "8. Buyer confirms delivery", result: delivered });

  // Step 9: Settlement released
  escrow.status = "settled";
  steps.push({ step: "9. Escrow settled — funds released to supplier", result: escrow });

  return { steps, escrow };
}
