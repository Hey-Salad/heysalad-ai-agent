import { isEnabled, type ModelProvider } from "../types";

export function getModelProvider(preferred?: string): ModelProvider {
  const provider = preferred || process.env.HEYSALAD_MODEL_PROVIDER || "openai";

  switch (provider) {
    case "huggingface":
      if (!isEnabled("HEYSALAD_HUGGINGFACE_ENABLED")) {
        throw new Error("Hugging Face integration is not enabled");
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./huggingface").huggingfaceProvider;

    case "azure":
      if (!isEnabled("HEYSALAD_MICROSOFT_ENABLED")) {
        throw new Error("Microsoft/Azure integration is not enabled");
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./azure-openai").azureProvider;

    case "openai":
    default:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./openai-models").openaiModelProvider;
  }
}
