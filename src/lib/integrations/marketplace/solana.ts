/**
 * Solana Devnet Integration
 *
 * Provides wallet, escrow, and Solana Pay support for the
 * CoralOS marketplace demo.
 *
 * Feature flag: HEYSALAD_SOLANA_ENABLED=true
 *
 * NOTE: This is a devnet-only demo. Do not use for production payments.
 */

import { isEnabled } from "../types";

const DEVNET_RPC = "https://api.devnet.solana.com";

export interface SolanaWallet {
  publicKey: string;
  network: "devnet";
}

export interface SolanaTransaction {
  signature: string;
  status: "confirmed" | "finalized" | "failed";
  explorerUrl: string;
}

function ensureEnabled() {
  if (!isEnabled("HEYSALAD_SOLANA_ENABLED")) {
    throw new Error("Solana integration is not enabled");
  }
}

/**
 * Request an airdrop on devnet for testing
 */
export async function requestAirdrop(publicKey: string, lamports: number = 1_000_000_000): Promise<string> {
  ensureEnabled();

  const res = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "requestAirdrop",
      params: [publicKey, lamports],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Airdrop failed: ${data.error.message}`);
  return data.result; // transaction signature
}

/**
 * Get SOL balance for a devnet wallet
 */
export async function getBalance(publicKey: string): Promise<{ sol: number; lamports: number }> {
  ensureEnabled();

  const res = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [publicKey],
    }),
  });

  const data = await res.json();
  const lamports = data.result?.value ?? 0;

  return {
    sol: lamports / 1_000_000_000,
    lamports,
  };
}

/**
 * Get recent transactions for a wallet
 */
export async function getTransactionHistory(
  publicKey: string,
  limit: number = 10
): Promise<Array<{ signature: string; slot: number; explorerUrl: string }>> {
  ensureEnabled();

  const res = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [publicKey, { limit }],
    }),
  });

  const data = await res.json();
  return (data.result || []).map((tx: { signature: string; slot: number }) => ({
    signature: tx.signature,
    slot: tx.slot,
    explorerUrl: `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`,
  }));
}

/**
 * Generate a Solana Pay URL for a payment request
 */
export function createSolanaPayUrl(params: {
  recipient: string;
  amount: number;
  label?: string;
  message?: string;
  memo?: string;
}): string {
  ensureEnabled();

  const url = new URL(`solana:${params.recipient}`);
  url.searchParams.set("amount", params.amount.toString());
  if (params.label) url.searchParams.set("label", params.label);
  if (params.message) url.searchParams.set("message", params.message);
  if (params.memo) url.searchParams.set("memo", params.memo);

  return url.toString();
}

/**
 * Get explorer link for a transaction
 */
export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/**
 * Get explorer link for an address
 */
export function getAddressExplorerUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}
