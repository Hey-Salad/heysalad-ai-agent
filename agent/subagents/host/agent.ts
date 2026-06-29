import { defineAgent } from "eve";

export default defineAgent({
  description: "Customer-facing AI receptionist for calls, FAQs, bookings, catering leads, and safe escalations.",
  model: process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini",
});
