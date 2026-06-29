import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTwimlResponse, generateTwimlGather } from "@/lib/twilio";
import { runHostAgent } from "@/lib/ai/agents/host";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const speechResult = formData.get("SpeechResult") as string | null;

    const business = await db.business.findFirst({
      where: { aiPhone: to },
      include: {
        agentConfigs: { where: { agentType: "HOST", active: true }, take: 1 },
      },
    });

    if (!business) {
      const twiml = generateTwimlResponse(
        "Sorry, this number is not currently configured. Please try again later."
      );
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    let call = await db.call.findUnique({ where: { twilioCallSid: callSid } });

    if (!call) {
      const conversation = await db.conversation.create({
        data: { businessId: business.id, channel: "VOICE", status: "OPEN" },
      });

      call = await db.call.create({
        data: {
          conversationId: conversation.id,
          businessId: business.id,
          twilioCallSid: callSid,
          fromNumber: from,
          toNumber: to,
          direction: "INBOUND",
          status: "IN_PROGRESS",
        },
      });
    }

    if (!speechResult) {
      const agentConfig = business.agentConfigs[0];
      const greeting =
        agentConfig?.greeting ||
        `Hello! Thank you for calling ${business.name}. How can I help you today?`;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const twiml = generateTwimlGather(greeting, `${appUrl}/api/twilio/voice`);
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Load knowledge for the host agent
    const knowledgeChunks = await db.knowledgeChunk.findMany({
      where: { businessId: business.id },
      select: { content: true, tags: true },
      take: 50,
    });

    const knowledgeContext = knowledgeChunks.length > 0
      ? knowledgeChunks.map((k) => k.content).join("\n\n")
      : "No knowledge base entries available yet.";

    const agentConfig = business.agentConfigs[0];
    const conversationHistory = call.transcript || "";

    const { response: hostResponse } = await runHostAgent({
      businessId: business.id,
      conversationId: call.conversationId ?? undefined,
      businessName: business.name,
      businessType: business.businessType,
      knowledgeContext,
      greeting: agentConfig?.greeting || `Hello! Thank you for calling ${business.name}.`,
      customerMessage: speechResult,
      conversationHistory,
      escalationRules: agentConfig?.escalationRulesJson as string | undefined,
      forbiddenClaims: agentConfig?.forbiddenClaimsJson as string[] | undefined,
    });

    await db.call.update({
      where: { id: call.id },
      data: {
        transcript: `${conversationHistory}\nCustomer: ${speechResult}\nAgent: ${hostResponse.responseText}`,
        summary: `Intent: ${hostResponse.intent} | Sentiment: ${hostResponse.sentiment}`,
      },
    });

    if (hostResponse.shouldEscalate) {
      const escalationMsg = `${hostResponse.responseText} I'm going to connect you with a team member who can help further.`;
      const twiml = generateTwimlResponse(escalationMsg);
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const twiml = generateTwimlGather(hostResponse.responseText, `${appUrl}/api/twilio/voice`);
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Twilio voice error:", error);
    const twiml = generateTwimlResponse(
      "Sorry, we are experiencing technical difficulties. Please try again later."
    );
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
