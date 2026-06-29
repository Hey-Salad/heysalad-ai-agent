import { defineAgent } from "eve";

export default defineAgent({
  description: "Knowledge onboarding and QA specialist for FAQs, menus, catalogues, policies, and missing facts.",
  model: process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini",
});
