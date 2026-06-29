import { z } from "zod";
import { runAgentWithTools } from "../gateway";
import { db } from "../../db";

const BookingSchema = z.object({
  action: z.literal("create_booking"),
  customerName: z.string(),
  customerPhone: z.string(),
  partySize: z.number(),
  date: z.string(),
  time: z.string(),
  specialRequests: z.string().optional(),
});

const TaskSchema = z.object({
  action: z.literal("create_task"),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

const HostResponseSchema = z.object({
  responseText: z.string(),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  shouldEscalate: z.boolean(),
  escalationReason: z.string().optional(),
  booking: BookingSchema.optional(),
  task: TaskSchema.optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
});

export type HostResponse = z.infer<typeof HostResponseSchema>;

interface HostAgentInput {
  businessId: string;
  conversationId?: string;
  businessName: string;
  businessType: string;
  knowledgeContext: string;
  greeting: string;
  customerMessage: string;
  conversationHistory?: string;
  escalationRules?: string;
  forbiddenClaims?: string[];
}

export async function runHostAgent(input: HostAgentInput): Promise<{
  response: HostResponse;
  agentRunId: string;
}> {
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

Respond with structured JSON including your response text, detected intent, confidence level, whether to escalate, sentiment, and optionally a booking or task to create.`;

  const result = await runAgentWithTools({
    businessId: input.businessId,
    conversationId: input.conversationId,
    agentType: "HOST",
    systemPrompt,
    userMessage: input.customerMessage,
    schema: HostResponseSchema,
    schemaName: "HostResponse",
    schemaDescription: "AI Host agent response with optional booking or task creation",
  });

  if (result.object.booking) {
    await processBooking(input.businessId, input.conversationId, result.object.booking);
  }
  if (result.object.task) {
    await processTask(input.businessId, input.conversationId, result.object.task);
  }

  return { response: result.object, agentRunId: result.agentRunId };
}

async function processBooking(
  businessId: string,
  conversationId: string | undefined,
  booking: z.infer<typeof BookingSchema>
) {
  let customer = await db.customer.findFirst({
    where: { businessId, phone: booking.customerPhone },
  });

  if (!customer) {
    customer = await db.customer.create({
      data: {
        businessId,
        name: booking.customerName,
        phone: booking.customerPhone,
      },
    });
  }

  await db.booking.create({
    data: {
      businessId,
      customerId: customer.id,
      conversationId,
      source: "AI_PHONE",
      status: "CONFIRMED",
      partySize: booking.partySize,
      bookingStart: new Date(`${booking.date}T${booking.time}`),
      specialRequests: booking.specialRequests,
    },
  });
}

async function processTask(
  businessId: string,
  conversationId: string | undefined,
  task: z.infer<typeof TaskSchema>
) {
  await db.task.create({
    data: {
      businessId,
      conversationId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "OPEN",
    },
  });
}
