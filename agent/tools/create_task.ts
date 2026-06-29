import { defineTool } from "eve/tools";
import { z } from "zod";
import { db } from "../../src/lib/db";

export default defineTool({
  description: "Create a staff follow-up task when the AI is uncertain, escalation is needed, or customer details should be reviewed.",
  inputSchema: z.object({
    businessId: z.string().min(1),
    locationId: z.string().min(1).optional(),
    customerId: z.string().min(1).optional(),
    conversationId: z.string().min(1).optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    dueAtIso: z.string().datetime().optional(),
  }),
  async execute(input) {
    const task = await db.task.create({
      data: {
        businessId: input.businessId,
        locationId: input.locationId,
        customerId: input.customerId,
        conversationId: input.conversationId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: "OPEN",
        dueAt: input.dueAtIso ? new Date(input.dueAtIso) : undefined,
      },
    });

    return {
      ok: true,
      taskId: task.id,
      status: task.status,
      priority: task.priority,
    };
  },
});
