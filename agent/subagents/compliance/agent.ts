import { defineAgent } from "eve";

export default defineAgent({
  description: "Safety and compliance reviewer for risky transcript claims, escalation failures, and policy gaps.",
  model: process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini",
});
