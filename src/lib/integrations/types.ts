/**
 * HeySalad® Sponsor Integration Framework
 *
 * Every sponsor integration follows the same pattern:
 * 1. Feature flag check (env var)
 * 2. Provider interface (abstraction)
 * 3. Concrete implementation
 * 4. Factory function
 */

// ---------------------------------------------------------------------------
// Feature Flags
// ---------------------------------------------------------------------------

export type SponsorFlag =
  | "HEYSALAD_OPENAI_RESPONSES"
  | "HEYSALAD_OPENAI_REALTIME"
  | "HEYSALAD_OPENAI_IMAGES"
  | "HEYSALAD_CORALOS_ENABLED"
  | "HEYSALAD_SOLANA_ENABLED"
  | "HEYSALAD_MICROSOFT_ENABLED"
  | "HEYSALAD_FETCHAI_ENABLED"
  | "HEYSALAD_ELEVENLABS_ENABLED"
  | "HEYSALAD_HUGGINGFACE_ENABLED"
  | "HEYSALAD_STRIPE_CONNECT"
  | "HEYSALAD_STRIPE_IDENTITY"
  | "HEYSALAD_STRIPE_ISSUING"
  | "HEYSALAD_AIRWALLEX_ENABLED"
  | "HEYSALAD_PAYPAL_ENABLED";

export function isEnabled(flag: SponsorFlag): boolean {
  return process.env[flag] === "true";
}

// ---------------------------------------------------------------------------
// Payment Provider Interface
// ---------------------------------------------------------------------------

export interface PaymentProvider {
  name: string;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
  refund(transactionId: string, amount?: number): Promise<RefundResult>;
}

export interface CheckoutParams {
  amount: number;
  currency: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, string>;
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  provider: string;
  intentId?: string;
  clientSecret?: string;
}

export interface WebhookResult {
  event: string;
  transactionId?: string;
  status: "succeeded" | "failed" | "pending";
  data: Record<string, unknown>;
}

export interface RefundResult {
  refundId: string;
  status: "succeeded" | "pending" | "failed";
  amount: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Voice Provider Interface
// ---------------------------------------------------------------------------

export interface VoiceProvider {
  name: string;
  synthesize(text: string, options?: VoiceOptions): Promise<VoiceSynthResult>;
  transcribe(audio: ArrayBuffer, options?: TranscribeOptions): Promise<TranscribeResult>;
}

export interface VoiceOptions {
  voiceId?: string;
  language?: string;
  speed?: number;
  format?: "mp3" | "pcm" | "opus";
}

export interface VoiceSynthResult {
  audio: ArrayBuffer;
  format: string;
  durationMs: number;
}

export interface TranscribeOptions {
  language?: string;
  model?: string;
}

export interface TranscribeResult {
  text: string;
  confidence: number;
  language: string;
}

// ---------------------------------------------------------------------------
// AI Model Provider Interface
// ---------------------------------------------------------------------------

export interface ModelProvider {
  name: string;
  generateText(params: ModelTextParams): Promise<ModelTextResult>;
  generateEmbedding(text: string): Promise<number[]>;
}

export interface ModelTextParams {
  model: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
}

export interface ModelTextResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

// ---------------------------------------------------------------------------
// Marketplace Agent Interface (CoralOS / Solana)
// ---------------------------------------------------------------------------

export interface MarketplaceAgent {
  type: "buyer" | "supplier" | "stock";
  id: string;
  execute(action: string, params: Record<string, unknown>): Promise<unknown>;
}

export interface EscrowTransaction {
  id: string;
  buyer: string;
  supplier: string;
  amount: number;
  status: "created" | "funded" | "delivered" | "settled" | "disputed";
  network: "devnet" | "mainnet";
}
