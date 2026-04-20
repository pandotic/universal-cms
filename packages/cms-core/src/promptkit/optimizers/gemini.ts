import type {
  OptimizationResult,
  OutputMode,
  PromptTone,
  RepoContext,
} from "../../types/promptkit.js";
import { getModelMeta } from "../models.js";

const PLEASANTRY_PATTERNS = [
  /\bplease\s+/gi,
  /\bcould you\s+/gi,
  /\bi was hoping\s+/gi,
  /\bif you could\s+/gi,
  /\bwould you mind\s+/gi,
];

const COMPLEX_TASK_SIGNALS = [
  /analyz/i,
  /compar/i,
  /evaluat/i,
  /design\s+a/i,
  /architect/i,
  /debug/i,
  /refactor/i,
  /review/i,
  /step[s]?\s+to/i,
  /explain\s+why/i,
  /trade.?off/i,
  /multi.?step/i,
];

const FACTUAL_TASK_SIGNALS = [
  /\b(fact|true|accurate|current|latest|recent|verify|confirm)\b/i,
  /\b(as of|up to date|news|report|statistic)\b/i,
];

function isComplexTask(text: string): boolean {
  return COMPLEX_TASK_SIGNALS.some((re) => re.test(text));
}

function isFactualTask(text: string): boolean {
  return FACTUAL_TASK_SIGNALS.some((re) => re.test(text));
}

function stripXmlTags(text: string): string {
  // Convert common XML tags to Markdown equivalents
  return text
    .replace(/<context>([\s\S]*?)<\/context>/gi, "## Context\n$1")
    .replace(/<instructions>([\s\S]*?)<\/instructions>/gi, "## Task\n$1")
    .replace(/<constraints>([\s\S]*?)<\/constraints>/gi, "## Requirements\n$1")
    .replace(/<examples>([\s\S]*?)<\/examples>/gi, "## Examples\n$1")
    .replace(/<output_format>([\s\S]*?)<\/output_format>/gi, "## Output Format\n$1")
    .replace(/<[^>]+>/g, ""); // strip any remaining tags
}

function convertToImperativeOpener(text: string): string {
  // Remove "You are a [role]." opener — Gemini doesn't benefit from role injection
  return text.replace(/^you are an? [\w\s]+\.\s*/i, "").trim();
}

function hasOutputSpec(text: string): boolean {
  return /\b(return|output|format|respond\s+with|in\s+(json|markdown|plain text|bullet|numbered list|a table)|## output)/i.test(
    text
  );
}

function inferOutputSpec(text: string): string {
  const t = text.toLowerCase();
  if (/\b(code|function|class|implement)\b/.test(t))
    return "Return only the code. No explanation.";
  if (/\b(list|enumerate|options|alternatives)\b/.test(t))
    return "Return a numbered list.";
  if (/\b(json|object|schema|data structure)\b/.test(t))
    return "Return valid JSON only. No prose.";
  if (/\b(summariz|summary|brief|overview)\b/.test(t))
    return "Return a concise summary in 2–3 sentences.";
  return "Be concise and direct.";
}

export function optimizeForGemini(
  raw: string,
  modelId: string,
  repo: RepoContext | undefined,
  tone: PromptTone,
  outputMode: OutputMode
): OptimizationResult {
  const notes: string[] = [];
  let prompt = raw.trim();
  const model = getModelMeta("gemini", modelId);
  const isPro = modelId.includes("pro");
  const is20Flash = modelId === "gemini-2.0-flash";

  // 1. Strip XML → Markdown
  if (/<[a-z]+>/.test(prompt)) {
    prompt = stripXmlTags(prompt);
    notes.push("Converted XML tags to Markdown headers (## Task, ## Context, etc.).");
  }

  // 2. Remove role-setting preamble, convert to imperative
  const stripped = convertToImperativeOpener(prompt);
  if (stripped !== prompt) {
    prompt = stripped;
    notes.push("Removed role-setting preamble; Gemini responds better to direct task framing.");
  }

  // 3. Tone application
  if (tone === "direct") {
    for (const pattern of PLEASANTRY_PATTERNS) {
      prompt = prompt.replace(pattern, "");
    }
  } else if (tone === "thorough") {
    prompt += "\n\nProvide a thorough analysis. Explain your reasoning.";
    notes.push("Added thorough analysis request.");
  } else if (tone === "collaborative") {
    prompt += "\n\nIf you need clarification, ask before proceeding.";
    notes.push("Added clarification request (collaborative tone).");
  } else if (tone === "aggressive") {
    prompt += "\n\nChallenge assumptions if you see a better approach.";
    notes.push("Added challenge instruction (aggressive tone).");
  }

  // 4. Context window invocation (Pro + long prompts)
  if (isPro && prompt.length > 300) {
    prompt += "\n\nUse your full context window to analyze the complete input before responding.";
    notes.push("Added context window invocation (Gemini Pro).");
  }

  // 5. Thinking mode trigger (Pro only, complex tasks)
  if (isPro && !is20Flash && isComplexTask(prompt)) {
    prompt += "\n\nThink carefully through each step before responding.";
    notes.push("Added thinking mode trigger (Gemini 2.5 Pro, complex task).");
  }

  // 6. Grounding for factual tasks
  if (isFactualTask(prompt)) {
    prompt += "\n\nBase your response only on verifiable information. If uncertain, say so explicitly.";
    notes.push("Added grounding instruction (factual task detected).");
  }

  // 7. Output spec
  if (!hasOutputSpec(prompt)) {
    const spec = inferOutputSpec(prompt);
    prompt += `\n\n## Output Format\n${spec}`;
    notes.push(`Added output format section: "${spec}"`);
  }

  // 8. Repo context injection as Markdown
  if (repo) {
    const contextSection = `## Repository Context\n- URL: ${repo.url}${repo.stack ? `\n- Stack: ${repo.stack}` : ""}${repo.description ? `\n- Description: ${repo.description}` : ""}\n\n`;
    prompt = contextSection + prompt;
    notes.push("Injected repository context as Markdown section.");
  }

  // 9. 2.0 Flash simplification
  if (is20Flash) {
    prompt = prompt.replace(/\n{3,}/g, "\n\n");
    if (!prompt.toLowerCase().includes("concisely") && !prompt.toLowerCase().includes("brief")) {
      prompt += "\n\nAnswer concisely.";
      notes.push("Added conciseness instruction (Gemini 2.0 Flash).");
    }
  }

  // 10. Phased output with --- dividers
  if (outputMode === "phased") {
    const lines = prompt.split("\n").filter(Boolean);
    const third = Math.ceil(lines.length / 3);
    const phases = [
      `## Phase 1 — Orientation\n\n${lines.slice(0, third).join("\n")}`,
      `## Phase 2 — Execution\n\n${lines.slice(third, third * 2).join("\n")}`,
      `## Phase 3 — Finalize\n\n${lines.slice(third * 2).join("\n")}`,
    ];
    notes.push("Split into 3 execution phases with Markdown headers.");
    return {
      prompt: phases,
      phaseLabels: ["Orientation", "Execution", "Finalize"],
      mode: "phased",
      notes,
    };
  }

  return { prompt, mode: "single", notes };
}
