import { defineAgent } from "eve";

export default defineAgent({
  model: process.env.AI_MODEL || "openai/gpt-4o",
  compaction: {
    thresholdPercent: 0.78,
  },
});
