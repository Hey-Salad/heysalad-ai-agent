import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Sales agent for lead research, prospect enrichment, outreach email drafting, and demo scripts.",
  model: process.env.AI_MODEL || "openai/gpt-4o",
});
