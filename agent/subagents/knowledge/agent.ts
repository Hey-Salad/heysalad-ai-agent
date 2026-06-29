import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Knowledge management agent for onboarding, FAQ curation, gap detection, and contradiction resolution.",
  model: process.env.AI_MODEL || "openai/gpt-4o",
});
