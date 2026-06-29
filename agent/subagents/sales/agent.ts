import { defineAgent } from "eve";

export default defineAgent({
  description: "Sales assistant for lead scoring, outreach, demo scripts, and partner-specific acquisition workflows.",
  model: process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini",
});
