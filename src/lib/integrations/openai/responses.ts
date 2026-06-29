/**
 * OpenAI Responses API Integration
 *
 * Uses the new Responses API for structured outputs, function calling,
 * and MCP compatibility.
 *
 * Feature flag: HEYSALAD_OPENAI_RESPONSES=true (falls back to Chat Completions if disabled)
 */

import { isEnabled } from "../types";

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return key;
}

interface ResponsesInput {
  model?: string;
  instructions?: string;
  input: string;
  tools?: ResponseTool[];
  text?: { format?: { type: "json_schema"; json_schema: Record<string, unknown> } };
}

interface ResponseTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Call the OpenAI Responses API (replaces Chat Completions for new features)
 */
export async function createResponse(input: ResponsesInput) {
  if (!isEnabled("HEYSALAD_OPENAI_RESPONSES")) {
    throw new Error("OpenAI Responses API is not enabled. Set HEYSALAD_OPENAI_RESPONSES=true");
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model || "gpt-4o",
      instructions: input.instructions,
      input: input.input,
      tools: input.tools,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Responses API failed (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Generate an image with DALL-E
 */
export async function generateImage(params: {
  prompt: string;
  model?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}) {
  if (!isEnabled("HEYSALAD_OPENAI_IMAGES")) {
    throw new Error("OpenAI image generation is not enabled. Set HEYSALAD_OPENAI_IMAGES=true");
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model || "dall-e-3",
      prompt: params.prompt,
      size: params.size || "1024x1024",
      quality: params.quality || "standard",
      n: params.n || 1,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI image generation failed: ${res.status}`);
  const data = await res.json();

  return {
    images: data.data.map((img: { url: string; revised_prompt: string }) => ({
      url: img.url,
      revisedPrompt: img.revised_prompt,
    })),
  };
}

/**
 * OpenAI Realtime API session creation (for future AI Terminal voice mode)
 */
export async function createRealtimeSession(params?: {
  model?: string;
  voice?: string;
  instructions?: string;
}) {
  if (!isEnabled("HEYSALAD_OPENAI_REALTIME")) {
    throw new Error("OpenAI Realtime API is not enabled. Set HEYSALAD_OPENAI_REALTIME=true");
  }

  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params?.model || "gpt-4o-realtime-preview",
      voice: params?.voice || "alloy",
      instructions: params?.instructions || "You are a helpful AI receptionist for a food business.",
    }),
  });

  if (!res.ok) throw new Error(`OpenAI Realtime session failed: ${res.status}`);
  return res.json();
}
