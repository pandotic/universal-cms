import type { OptimizationResult, PromptConfig } from "../../types/promptkit.js";
import { optimizeForClaude } from "./claude.js";
import { optimizeForGemini } from "./gemini.js";
import { optimizeForOpenAI } from "./openai.js";

export { optimizeForClaude } from "./claude.js";
export { optimizeForGemini } from "./gemini.js";
export { optimizeForOpenAI } from "./openai.js";

export function optimizePrompt(config: PromptConfig): OptimizationResult {
  const raw = buildRawFromConfig(config);
  const { provider, model } = config.target;
  const tone = config.tone ?? "direct";
  const outputMode = config.outputMode ?? "single";
  const repo = config.repo;

  switch (provider) {
    case "claude":
      return optimizeForClaude(raw, model, repo, tone, outputMode);
    case "gemini":
      return optimizeForGemini(raw, model, repo, tone, outputMode);
    case "openai":
      return optimizeForOpenAI(raw, model, repo, tone, outputMode);
    default:
      return { prompt: raw, mode: outputMode, notes: [] };
  }
}

function buildRawFromConfig(config: PromptConfig): string {
  if (config.mode === "quick") return config.rawPrompt ?? "";

  const parts: string[] = [];
  if (config.goal) parts.push(`Goal: ${config.goal}`);
  if (config.subject) parts.push(`Subject: ${config.subject}`);
  config.sections
    ?.sort((a, b) => a.order - b.order)
    .forEach((s) => {
      if (s.title || s.body) parts.push(`${s.title}\n${s.body}`);
    });
  if (config.constraints) parts.push(`Constraints: ${config.constraints}`);
  if (config.deliverable) parts.push(`Deliverable: ${config.deliverable}`);
  return parts.join("\n\n");
}
