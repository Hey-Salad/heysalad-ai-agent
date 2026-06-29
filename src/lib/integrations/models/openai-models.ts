import type { ModelProvider, ModelTextParams, ModelTextResult } from "../types";

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return key;
}

export const openaiModelProvider: ModelProvider = {
  name: "openai",

  async generateText(params: ModelTextParams): Promise<ModelTextResult> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model || "gpt-4o",
        messages: [
          ...(params.system ? [{ role: "system" as const, content: params.system }] : []),
          { role: "user" as const, content: params.prompt },
        ],
        max_tokens: params.maxTokens,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI generation failed: ${res.status}`);
    const data = await res.json();

    return {
      text: data.choices[0]?.message?.content || "",
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI embedding failed: ${res.status}`);
    const data = await res.json();
    return data.data[0]?.embedding || [];
  },
};
