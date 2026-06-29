/**
 * HeySalad® Integration Registry
 *
 * Central entry point for all sponsor integrations.
 * Each integration is lazy-loaded and feature-flagged.
 */

export { isEnabled, type SponsorFlag } from "./types";
export type {
  PaymentProvider,
  VoiceProvider,
  ModelProvider,
  MarketplaceAgent,
  EscrowTransaction,
} from "./types";

// Re-export provider factories
export { getPaymentProvider } from "./payments";
export { getVoiceProvider } from "./voice";
export { getModelProvider } from "./models";
