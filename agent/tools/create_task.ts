import { z } from "zod";
import { defineTool } from "eve";

export default defineTool({
  description:
    "Create a follow-up task for staff when the agent cannot fully resolve a request.",
  parameters: z.object({
    businessId: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    conversationId: z.string().optional(),
  }),
  async execute(params) {
    const baseUrl = process.env.HEYSALAD_API_URL;
    if (!baseUrl) {
      return { error: "HEYSALAD_API_URL not configured" };
    }

    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HEYSALAD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        status: "OPEN",
        source: "AI_AGENT",
      }),
    });

    if (!res.ok) {
      return { error: `Failed to create task: ${res.status}` };
    }

    const task = await res.json();
    return {
      success: true,
      taskId: task.id,
      message: `Task "${params.title}" created for staff follow-up.`,
    };
  },
});
