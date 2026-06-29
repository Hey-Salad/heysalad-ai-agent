import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { runHostAgent } from "@/lib/ai/agents/host";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.businessId || !body.businessName || !body.customerMessage) {
      return NextResponse.json(
        { error: "businessId, businessName, and customerMessage are required" },
        { status: 400 }
      );
    }

    const { response, agentRunId } = await runHostAgent({
      businessId: body.businessId,
      conversationId: body.conversationId,
      businessName: body.businessName,
      businessType: body.businessType || "RESTAURANT",
      knowledgeContext: body.knowledgeContext || "",
      greeting: body.greeting || `Thanks for contacting ${body.businessName}.`,
      customerMessage: body.customerMessage,
      conversationHistory: body.conversationHistory,
      escalationRules: body.escalationRules,
      forbiddenClaims: body.forbiddenClaims,
    });

    return NextResponse.json({ response, agentRunId });
  } catch (error) {
    console.error("Host agent error:", error);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  }
}
