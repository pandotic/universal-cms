import type {
  LLMProvider,
  ModelId,
  ClaudeModel,
  GeminiModel,
  OpenAIModel,
} from "../types/promptkit.js";

export interface ModelMeta {
  id: ModelId;
  label: string;
  contextWindow: string;
  strengths: string[];
  bestFor: string[];
  supportsTools: boolean;
  supportsVision: boolean;
  tier: "flagship" | "balanced" | "fast";
  badge?: string;
  isReasoningModel?: boolean;
}

export const MODELS: Record<LLMProvider, ModelMeta[]> = {
  claude: [
    {
      id: "claude-opus-4-5" as ClaudeModel,
      label: "Claude Opus 4.5",
      contextWindow: "200K",
      strengths: ["complex reasoning", "nuanced instruction following", "long-horizon tasks"],
      bestFor: ["deep research", "complex codebases", "multi-step planning"],
      supportsTools: true,
      supportsVision: true,
      tier: "flagship",
      badge: "Most powerful",
    },
    {
      id: "claude-sonnet-4-5" as ClaudeModel,
      label: "Claude Sonnet 4.5",
      contextWindow: "200K",
      strengths: ["speed + intelligence balance", "agentic coding", "tool use"],
      bestFor: ["everyday coding", "Claude Code sessions", "production workloads"],
      supportsTools: true,
      supportsVision: true,
      tier: "balanced",
      badge: "Recommended",
    },
    {
      id: "claude-haiku-4-5" as ClaudeModel,
      label: "Claude Haiku 4.5",
      contextWindow: "200K",
      strengths: ["speed", "cost efficiency"],
      bestFor: ["quick queries", "high-volume", "simple tasks"],
      supportsTools: true,
      supportsVision: false,
      tier: "fast",
      badge: "Fastest",
    },
  ],
  gemini: [
    {
      id: "gemini-2.5-pro" as GeminiModel,
      label: "Gemini 2.5 Pro",
      contextWindow: "1M",
      strengths: ["massive context", "multimodal", "deep reasoning"],
      bestFor: ["huge codebases", "video/image analysis", "complex reasoning"],
      supportsTools: true,
      supportsVision: true,
      tier: "flagship",
      badge: "1M context",
    },
    {
      id: "gemini-2.5-flash" as GeminiModel,
      label: "Gemini 2.5 Flash",
      contextWindow: "1M",
      strengths: ["fast", "cost efficient", "thinking mode"],
      bestFor: ["rapid iteration", "everyday tasks"],
      supportsTools: true,
      supportsVision: true,
      tier: "balanced",
      badge: "Recommended",
    },
    {
      id: "gemini-2.0-flash" as GeminiModel,
      label: "Gemini 2.0 Flash",
      contextWindow: "1M",
      strengths: ["speed", "reliability"],
      bestFor: ["fast responses", "simple tasks"],
      supportsTools: true,
      supportsVision: true,
      tier: "fast",
    },
  ],
  openai: [
    {
      id: "gpt-4o" as OpenAIModel,
      label: "GPT-4o",
      contextWindow: "128K",
      strengths: ["versatile", "multimodal", "broad knowledge"],
      bestFor: ["general tasks", "creative work", "analysis"],
      supportsTools: true,
      supportsVision: true,
      tier: "flagship",
      badge: "Most versatile",
    },
    {
      id: "o3" as OpenAIModel,
      label: "o3",
      contextWindow: "200K",
      strengths: ["deep reasoning", "math", "science"],
      bestFor: ["complex reasoning", "math", "research"],
      supportsTools: true,
      supportsVision: true,
      tier: "flagship",
      badge: "Best reasoning",
      isReasoningModel: true,
    },
    {
      id: "o4-mini" as OpenAIModel,
      label: "o4 mini",
      contextWindow: "200K",
      strengths: ["fast reasoning", "cost-efficient"],
      bestFor: ["everyday reasoning", "coding"],
      supportsTools: true,
      supportsVision: true,
      tier: "balanced",
      badge: "Fast + smart",
      isReasoningModel: true,
    },
    {
      id: "gpt-4o-mini" as OpenAIModel,
      label: "GPT-4o mini",
      contextWindow: "128K",
      strengths: ["speed", "cost"],
      bestFor: ["quick tasks", "high volume"],
      supportsTools: true,
      supportsVision: true,
      tier: "fast",
      badge: "Cheapest",
    },
  ],
};

export const LLM_META: Record<
  LLMProvider,
  {
    label: string;
    accentColor: string;
    accentClass: string;
    icon: string;
    company: string;
    openUrl: string;
    defaultModel: ModelId;
  }
> = {
  claude: {
    label: "Claude",
    accentColor: "#D97706",
    accentClass: "amber",
    icon: "◆",
    company: "Anthropic",
    openUrl: "https://claude.ai",
    defaultModel: "claude-sonnet-4-5",
  },
  gemini: {
    label: "Gemini",
    accentColor: "#3B82F6",
    accentClass: "blue",
    icon: "✦",
    company: "Google",
    openUrl: "https://gemini.google.com",
    defaultModel: "gemini-2.5-flash",
  },
  openai: {
    label: "ChatGPT",
    accentColor: "#10B981",
    accentClass: "emerald",
    icon: "◉",
    company: "OpenAI",
    openUrl: "https://chatgpt.com",
    defaultModel: "gpt-4o",
  },
};

export function getDefaultModel(provider: LLMProvider): ModelId {
  return LLM_META[provider].defaultModel;
}

export function getModelMeta(
  provider: LLMProvider,
  modelId: ModelId
): ModelMeta | undefined {
  return MODELS[provider].find((m) => m.id === modelId);
}
