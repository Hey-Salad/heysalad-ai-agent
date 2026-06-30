export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { buildKioskKnowledgeContext, KIOSK_CONFIG } from "@kiosk/catalog";
import { runHostAgent } from "@/lib/ai/agents/host";
import { ensureKioskBusiness } from "@/lib/kiosk-business";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const business = await ensureKioskBusiness();
    const result = await runHostAgent({
      businessId: business.id,
      businessName: business.name,
      businessType: business.businessType,
      knowledgeContext: buildKioskKnowledgeContext(),
      greeting: KIOSK_CONFIG.greeting,
      customerMessage: message,
      conversationHistory: body.conversationHistory
    });

    return NextResponse.json({
      message: result.response.responseText,
      intent: result.response.intent,
      confidence: result.response.confidence,
      shouldEscalate: result.response.shouldEscalate,
      agentRunId: result.agentRunId
    });
  } catch (error) {
    console.error("Kiosk assistant error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kiosk assistant failed" },
      { status: 500 }
    );
  }
}
