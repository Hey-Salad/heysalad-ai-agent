import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Operations agent for daily summaries, unresolved work tracking, and operational insights.",
  model: process.env.AI_MODEL || "openai/gpt-4o",
});
