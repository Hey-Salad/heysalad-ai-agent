import { generateObject, generateText } from "ai";
import { z } from "zod";

const DEFAULT_MODEL = "openai/gpt-4o";

function resolveModel(model?: string) {
  const configured = model || process.env.AI_MODEL || DEFAULT_MODEL;
  return configured.includes("/") ? configured : `openai/${configured}`;
}

function getProviderOptions() {
  if (!process.env.OPENAI_API_KEY) return undefined;
  return {
    gateway: {
      byok: {
        openai: [{ apiKey: process.env.OPENAI_API_KEY }],
      },
    },
  };
}

// Host Agent response schema
export const HostResponseSchema = z.object({
  responseText: z.string(),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  shouldEscalate: z.boolean(),
  escalationReason: z.string().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  booking: z
    .object({
      customerName: z.string(),
      customerPhone: z.string(),
      partySize: z.number(),
      date: z.string(),
      time: z.string(),
      specialRequests: z.string().optional(),
    })
    .optional(),
  task: z
    .object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    })
    .optional(),
});

export type HostResponse = z.infer<typeof HostResponseSchema>;

export interface HostInput {
  businessName: string;
  businessType: string;
  knowledgeContext: string;
  greeting: string;
  customerMessage: string;
  conversationHistory?: string;
  escalationRules?: string;
  forbiddenClaims?: string[];
}

export async function runHostAgent(input: HostInput) {
  const model = resolveModel();

  const systemPrompt = `You are an AI receptionist for ${input.businessName}, a ${input.businessType}.

Your greeting: "${input.greeting}"

KNOWLEDGE BASE:
${input.knowledgeContext}

RULES:
- Never invent prices, allergens, opening hours, stock availability, or policies
- If unsure, say you will check with the team
- Escalate: allergy concerns, medical issues, legal questions, payment/refund requests, angry customers, safety issues
- Always be polite and professional
- Only answer from the knowledge base above
- If asked whether you are AI, be honest
${input.forbiddenClaims?.length ? `\nFORBIDDEN CLAIMS (never say these):\n${input.forbiddenClaims.join("\n")}` : ""}
${input.escalationRules ? `\nESCALATION RULES:\n${input.escalationRules}` : ""}
${input.conversationHistory ? `\nCONVERSATION SO FAR:\n${input.conversationHistory}` : ""}

Respond with structured JSON.`;

  const result = await generateObject({
    model,
    system: systemPrompt,
    prompt: input.customerMessage,
    schema: HostResponseSchema,
    schemaName: "HostResponse",
    schemaDescription: "AI Host agent response",
    providerOptions: getProviderOptions(),
  });

  return result.object;
}

// Knowledge Agent
export async function runKnowledgeAgent(input: {
  businessName: string;
  knowledgeBase: string;
  query: string;
}) {
  const model = resolveModel();

  const result = await generateText({
    model,
    system: `You are the Knowledge agent for ${input.businessName}. Analyse the knowledge base and answer queries about gaps, contradictions, or content suggestions.\n\nKNOWLEDGE BASE:\n${input.knowledgeBase}`,
    prompt: input.query,
    providerOptions: getProviderOptions(),
  });

  return { text: result.text };
}

// Sales Agent
export const SalesResponseSchema = z.object({
  prospectSummary: z.string(),
  outreachEmail: z.string(),
  leadScore: z.number().min(0).max(100),
  keyInsights: z.array(z.string()),
  recommendedApproach: z.string(),
});

export async function runSalesAgent(input: {
  prospectName: string;
  prospectType: string;
  prospectInfo: string;
  productContext: string;
}) {
  const model = resolveModel();

  const result = await generateObject({
    model,
    system: `You are a B2B sales agent for HeySalad. Research the prospect and draft personalised outreach.\n\nPRODUCT:\n${input.productContext}`,
    prompt: `Prospect: ${input.prospectName} (${input.prospectType})\n\nInfo:\n${input.prospectInfo}`,
    schema: SalesResponseSchema,
    schemaName: "SalesResponse",
    schemaDescription: "Sales outreach response",
    providerOptions: getProviderOptions(),
  });

  return result.object;
}

// Operations Agent
export async function runOperationsAgent(input: {
  businessName: string;
  operationsData: string;
  query: string;
}) {
  const model = resolveModel();

  const result = await generateText({
    model,
    system: `You are the Operations agent for ${input.businessName}. Analyse operational data and provide actionable summaries.\n\nDATA:\n${input.operationsData}`,
    prompt: input.query,
    providerOptions: getProviderOptions(),
  });

  return { text: result.text };
}

// Compliance Agent
export const ComplianceResponseSchema = z.object({
  riskScore: z.number().min(0).max(100),
  issues: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      category: z.string(),
      description: z.string(),
      transcript_excerpt: z.string(),
      recommendation: z.string(),
    })
  ),
  summary: z.string(),
  passedAudit: z.boolean(),
});

export async function runComplianceAgent(input: {
  businessName: string;
  transcript: string;
  forbiddenClaims?: string[];
}) {
  const model = resolveModel();

  const result = await generateObject({
    model,
    system: `You are the Compliance agent. Audit this transcript for risky claims, forbidden statements, and regulatory issues.\n\nBusiness: ${input.businessName}\n${input.forbiddenClaims?.length ? `\nFORBIDDEN CLAIMS:\n${input.forbiddenClaims.join("\n")}` : ""}`,
    prompt: `Transcript:\n${input.transcript}`,
    schema: ComplianceResponseSchema,
    schemaName: "ComplianceResponse",
    schemaDescription: "Compliance audit response",
    providerOptions: getProviderOptions(),
  });

  return result.object;
}
