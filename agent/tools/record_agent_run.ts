import { z } from "zod";
import { defineTool } from "eve";

export default defineTool({
  description: "Record an agent run for analytics and audit trail.",
  parameters: z.object({
    businessId: z.string(),
    agentType: z.enum(["HOST", "KNOWLEDGE", "SALES", "OPERATIONS", "COMPLIANCE"]),
    conversationId: z.string().optional(),
    intent: z.string(),
    sentiment: z.enum(["positive", "neutral", "negative"]),
    escalated: z.boolean(),
    summary: z.string(),
  }),
  async execute(params) {
    const baseUrl = process.env.HEYSALAD_API_URL;
    if (!baseUrl) {
      return { error: "HEYSALAD_API_URL not configured" };
    }

    const res = await fetch(`${baseUrl}/api/agent/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HEYSALAD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      return { error: `Failed to record run: ${res.status}` };
    }

    return { success: true };
  },
});
