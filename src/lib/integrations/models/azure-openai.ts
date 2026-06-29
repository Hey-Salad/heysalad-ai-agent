import type { ModelProvider, ModelTextParams, ModelTextResult } from "../types";

function getConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
  if (!endpoint || !key) throw new Error("Azure OpenAI credentials not configured");
  return { endpoint, key, apiVersion };
}

export const azureProvider: ModelProvider = {
  name: "azure-openai",

  async generateText(params: ModelTextParams): Promise<ModelTextResult> {
    const { endpoint, key, apiVersion } = getConfig();
    const deployment = params.model || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

    const res = await fetch(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...(params.system ? [{ role: "system" as const, content: params.system }] : []),
            { role: "user" as const, content: params.prompt },
          ],
          max_tokens: params.maxTokens,
        }),
      }
    );

    if (!res.ok) throw new Error(`Azure OpenAI generation failed: ${res.status}`);
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
    const { endpoint, key, apiVersion } = getConfig();
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-small";

    const res = await fetch(
      `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: text }),
      }
    );

    if (!res.ok) throw new Error(`Azure OpenAI embedding failed: ${res.status}`);
    const data = await res.json();
    return data.data[0]?.embedding || [];
  },
};
