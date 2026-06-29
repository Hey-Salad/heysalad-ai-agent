import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Customer-facing AI receptionist for calls, FAQs, bookings, catering leads, and safe escalations.",
  model: process.env.AI_MODEL || "openai/gpt-4o",
});
