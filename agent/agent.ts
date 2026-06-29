import { defineAgent } from "eve";

const model = process.env.HEYSALAD_AI_MODEL || "openai/gpt-5.4-mini";

export default defineAgent({
  model,
  compaction: {
    thresholdPercent: 0.78,
  },
  build: {
    externalDependencies: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  },
});
