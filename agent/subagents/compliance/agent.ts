import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Compliance agent for transcript auditing, risky claim detection, and regulatory safety checks.",
  model: process.env.AI_MODEL || "openai/gpt-4o",
});
