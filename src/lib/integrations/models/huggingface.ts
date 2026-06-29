import type { ModelProvider, ModelTextParams, ModelTextResult } from "../types";

const BASE_URL = "https://api-inference.huggingface.co";

function getApiKey() {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) throw new Error("HUGGINGFACE_API_KEY not configured");
  return key;
}

export const huggingfaceProvider: ModelProvider = {
  name: "huggingface",

  async generateText(params: ModelTextParams): Promise<ModelTextResult> {
    const model = params.model || "mistralai/Mixtral-8x7B-Instruct-v0.1";

    const res = await fetch(`${BASE_URL}/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: params.system
          ? `<s>[INST] ${params.system}\n\n${params.prompt} [/INST]`
          : params.prompt,
        parameters: {
          max_new_tokens: params.maxTokens || 1024,
          return_full_text: false,
        },
      }),
    });

    if (!res.ok) throw new Error(`Hugging Face generation failed: ${res.status}`);
    const data = await res.json();
    const text = Array.isArray(data) ? data[0]?.generated_text || "" : "";

    return {
      text,
      usage: { inputTokens: 0, outputTokens: 0 }, // HF Inference API doesn't return token counts
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const model = process.env.HUGGINGFACE_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";

    const res = await fetch(`${BASE_URL}/pipeline/feature-extraction/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!res.ok) throw new Error(`Hugging Face embedding failed: ${res.status}`);
    const data = await res.json();

    // HF returns nested arrays for sentence-transformers; flatten to 1D
    return Array.isArray(data[0]) ? data[0] : data;
  },
};
