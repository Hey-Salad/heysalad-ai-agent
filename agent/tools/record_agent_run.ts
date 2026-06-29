import { defineTool } from "eve/tools";
import { z } from "zod";
import { db } from "../../src/lib/db";
import { toPrismaJson } from "../../src/lib/json";

export default defineTool({
  description: "Record a HeySalad® agent run summary in Prisma for dashboards and quality review.",
  inputSchema: z.object({
    businessId: z.string().min(1),
    locationId: z.string().min(1).optional(),
    conversationId: z.string().min(1).optional(),
    agentType: z.enum(["HOST", "KNOWLEDGE", "SALES", "OPERATIONS", "COMPLIANCE"]),
    model: z.string().min(1).optional(),
    status: z.enum(["COMPLETED", "FAILED"]).default("COMPLETED"),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    toolCalls: z.unknown().optional(),
    error: z.string().optional(),
  }),
  async execute(input) {
    const run = await db.agentRun.create({
      data: {
        businessId: input.businessId,
        locationId: input.locationId,
        conversationId: input.conversationId,
        agentType: input.agentType,
        model: input.model || process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini",
        status: input.status,
        inputJson: input.input === undefined ? undefined : toPrismaJson(input.input),
        outputJson: input.output === undefined ? undefined : toPrismaJson(input.output),
        toolCallsJson: input.toolCalls === undefined ? undefined : toPrismaJson(input.toolCalls),
        error: input.error,
      },
    });

    return { ok: true, agentRunId: run.id };
  },
});
