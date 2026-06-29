import { defineAgent } from "eve";

export default defineAgent({
  description: "Operations analyst for daily summaries, unresolved tasks, customer-demand patterns, and recommended updates.",
  model: process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini",
});
