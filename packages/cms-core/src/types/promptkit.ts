export type LLMProvider = "claude" | "gemini" | "openai";

export type ClaudeModel =
  | "claude-opus-4-5"
  | "claude-sonnet-4-5"
  | "claude-haiku-4-5";

export type GeminiModel =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash";

export type OpenAIModel = "gpt-4o" | "gpt-4o-mini" | "o3" | "o4-mini";

export type ModelId = ClaudeModel | GeminiModel | OpenAIModel | string;
export type OutputMode = "single" | "phased";
export type PromptTone =
  | "direct"
  | "thorough"
  | "collaborative"
  | "aggressive";
export type AppMode = "quick" | "builder";

export interface LLMTarget {
  provider: LLMProvider;
  model: ModelId;
}

export interface RepoContext {
  url: string;
  description?: string;
  stack?: string;
  isClaudeCode: boolean;
}

export interface PromptSection {
  id: string;
  title: string;
  body: string;
  order: number;
}

export interface PromptConfig {
  id?: string;
  userId?: string;
  mode: AppMode;
  target: LLMTarget;
  repo?: RepoContext;
  rawPrompt?: string;
  goal?: string;
  subject?: string;
  sections?: PromptSection[];
  constraints?: string;
  tone?: PromptTone;
  deliverable?: string;
  outputMode?: OutputMode;
  optimizedPrompt?: string | string[];
  phaseLabels?: string[];
  notes?: string[];
  createdAt?: number;
  isFavorite?: boolean;
  label?: string;
}

export interface OptimizationResult {
  prompt: string | string[];
  phaseLabels?: string[];
  mode: OutputMode;
  notes: string[];
}

export interface HistoryItem {
  id: string;
  provider: LLMProvider;
  modelId: ModelId;
  modelLabel: string;
  rawPrompt: string;
  optimizedPrompt: string;
  notes: string[];
  tone: PromptTone;
  siteName?: string;
  timestamp: number;
}

export interface UserPreferences {
  defaultProvider: LLMProvider;
  defaultModels: Record<LLMProvider, ModelId>;
  theme: "light" | "dark" | "system";
}
