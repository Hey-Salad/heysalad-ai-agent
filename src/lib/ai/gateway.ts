import { generateText, generateObject, type LanguageModelUsage } from "ai";
import { z } from "zod";
import { db } from "../db";
import { AgentType, Prisma } from "@/generated/prisma/client";

const DEFAULT_MODEL = "openai/gpt-4o";

interface AgentRunOptions {
  businessId: string;
  conversationId?: string;
  agentType: AgentType;
  model?: string;
  systemPrompt: string;
  userMessage: string;
}

function resolveModel(model?: string) {
  const configured = model || process.env.AI_MODEL || DEFAULT_MODEL;
  return configured.includes("/") ? configured : `openai/${configured}`;
}

function getProviderOptions() {
  if (!process.env.OPENAI_API_KEY) return undefined;
  return {
    gateway: {
      byok: {
        openai: [{ apiKey: process.env.OPENAI_API_KEY }],
      },
    },
  };
}

function serializeUsage(usage?: LanguageModelUsage) {
  if (!usage) return undefined;
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

export async function runAgent(options: AgentRunOptions) {
  const model = resolveModel(options.model);
  const startTime = Date.now();

  const agentRun = await db.agentRun.create({
    data: {
      businessId: options.businessId,
      conversationId: options.conversationId,
      agentType: options.agentType,
      model,
      status: "RUNNING",
      inputJson: {
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
      },
    },
  });

  try {
    const result = await generateText({
      model,
      system: options.systemPrompt,
      prompt: options.userMessage,
      providerOptions: getProviderOptions(),
    });

    await db.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "COMPLETED",
        outputJson: { text: result.text },
        tokenUsageJson: serializeUsage(result.usage),
        latencyMs: Date.now() - startTime,
      },
    });

    return { text: result.text, agentRunId: agentRun.id, usage: result.usage };
  } catch (error) {
    await db.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function runAgentWithTools<T extends z.ZodType>(
  options: AgentRunOptions & {
    schema: T;
    schemaName: string;
    schemaDescription: string;
  }
) {
  const model = resolveModel(options.model);
  const startTime = Date.now();

  const agentRun = await db.agentRun.create({
    data: {
      businessId: options.businessId,
      conversationId: options.conversationId,
      agentType: options.agentType,
      model,
      status: "RUNNING",
      inputJson: {
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
      },
    },
  });

  try {
    const result = await generateObject({
      model,
      system: options.systemPrompt,
      prompt: options.userMessage,
      schema: options.schema,
      schemaName: options.schemaName,
      schemaDescription: options.schemaDescription,
      providerOptions: getProviderOptions(),
    });

    await db.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "COMPLETED",
        outputJson: result.object as Prisma.InputJsonValue,
        tokenUsageJson: serializeUsage(result.usage),
        latencyMs: Date.now() - startTime,
      },
    });

    return { object: result.object, agentRunId: agentRun.id, usage: result.usage };
  } catch (error) {
    await db.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
