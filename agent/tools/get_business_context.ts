import { z } from "zod";
import { defineTool } from "eve";

export default defineTool({
  description:
    "Retrieve business context including knowledge base, settings, and catalogue for the active business.",
  parameters: z.object({
    businessId: z.string().describe("The business ID to load context for"),
  }),
  async execute({ businessId }) {
    const baseUrl = process.env.HEYSALAD_API_URL;
    if (!baseUrl) {
      return {
        error: "HEYSALAD_API_URL not configured",
        businessId,
      };
    }

    const res = await fetch(`${baseUrl}/api/agent/context/${businessId}`, {
      headers: {
        Authorization: `Bearer ${process.env.HEYSALAD_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return {
        error: `Failed to load context: ${res.status}`,
        businessId,
      };
    }

    return res.json();
  },
});
