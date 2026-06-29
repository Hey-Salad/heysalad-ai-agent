import { NextRequest } from "next/server";

/**
 * Validate API key from Authorization header.
 * Used to protect agent API routes.
 */
export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const validKey = process.env.AGENT_API_KEY;

  if (!validKey) return false;
  return token === validKey;
}
