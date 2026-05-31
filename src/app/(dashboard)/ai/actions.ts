"use server";

import {
  fetchVerdaAiClubContext,
  type VerdaAiClubContext,
} from "@/lib/verda-ai/club-context";
import {
  buildSuggestedQuestions,
  buildVerdaAiInsights,
  buildWelcomeMessage,
  generateVerdaAiReply,
  type VerdaAiChatMessage,
  type VerdaAiInsight,
} from "@/lib/verda-ai/generate";

export interface VerdaAiBootstrapResult {
  error?: string;
  welcome?: string;
  insights?: VerdaAiInsight[];
  suggestions?: string[];
  llmEnabled?: boolean;
}

export interface VerdaAiChatResult {
  error?: string;
  reply?: string;
  usedLlm?: boolean;
}

async function loadContext(): Promise<
  VerdaAiClubContext | { error: string }
> {
  return fetchVerdaAiClubContext();
}

export async function verdaAiBootstrapAction(): Promise<VerdaAiBootstrapResult> {
  const ctx = await loadContext();
  if ("error" in ctx) return { error: ctx.error };

  return {
    welcome: buildWelcomeMessage(ctx),
    insights: buildVerdaAiInsights(ctx),
    suggestions: buildSuggestedQuestions(ctx),
    llmEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}

export async function verdaAiChatAction(
  messages: VerdaAiChatMessage[],
): Promise<VerdaAiChatResult> {
  const trimmed = messages
    .filter((m) => m.content.trim())
    .slice(-12)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 2000),
    }));

  if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") {
    return { error: "Escribe un mensaje." };
  }

  const ctx = await loadContext();
  if ("error" in ctx) return { error: ctx.error };

  const { reply, usedLlm } = await generateVerdaAiReply(ctx, trimmed);
  return { reply, usedLlm };
}
