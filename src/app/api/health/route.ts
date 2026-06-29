import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "0.2.0",
    platform: "heysalad-ai-agent",
    agents: ["host", "knowledge", "sales", "operations", "compliance"],
    integrations: {
      payments: ["stripe", "airwallex", "paypal"],
      voice: ["twilio", "elevenlabs", "openai"],
      models: ["openai", "huggingface", "azure"],
      marketplace: ["coralos", "solana"],
    },
  });
}
