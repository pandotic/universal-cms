import type {
  OptimizationResult,
  OutputMode,
  PromptTone,
  RepoContext,
} from "../../types/promptkit.js";
import { getModelMeta } from "../models.js";

const NEGATIVE_PATTERNS: Array<[RegExp, (m: string, v: string) => string]> = [
  [/\bdon'?t\s+(\w+)/gi, (_m: string, v: string) => `do ${v}`],
  [/\bnever\s+(\w+)/gi, (_m: string, v: string) => `always avoid ${v}`],
  [/\bavoid\s+(\w+ing)/gi, (_m: string, v: string) => `instead of ${v},`],
  [/\bdo not\s+(\w+)/gi, (_m: string, v: string) => `${v}`],
];

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
  /how\s+(do|should|would|can)/i,
  /explain\s+why/i,
  /trade.?off/i,
];

function isComplexTask(text: string): boolean {
  return COMPLEX_TASK_SIGNALS.some((re) => re.test(text));
}

function inferRole(text: string): string {
  const t = text.toLowerCase();
  if (/\b(code|function|class|typescript|javascript|python|sql|api|bug)\b/.test(t))
    return "senior software engineer";
  if (/\b(write|draft|article|blog|copy|content|email)\b/.test(t))
    return "expert technical writer";
  if (/\b(data|analyz|dataset|csv|chart|metric|statistic)\b/.test(t))
    return "data analyst";
  if (/\b(design|ux|ui|component|layout|style)\b/.test(t))
    return "UX/UI designer";
  if (/\b(review|audit|security|vulnerabilit)\b/.test(t))
    return "security-focused senior engineer";
  if (/\b(seo|keyword|ranking|search|organic)\b/.test(t))
    return "SEO specialist";
  if (/\b(market|brand|strateg|campaign|audience)\b/.test(t))
    return "marketing strategist";
  return "expert assistant";
}

function hasOutputSpec(text: string): boolean {
  return /\b(return|output|format|respond\s+with|in\s+(json|markdown|plain text|bullet|numbered list|a table))/i.test(
    text
  );
}

function inferOutputSpec(text: string): string {
  const t = text.toLowerCase();
  if (/\b(code|function|class|implement)\b/.test(t))
    return "Return only the code. No explanation. No markdown fences.";
  if (/\b(list|enumerate|options|alternatives)\b/.test(t))
    return "Return a numbered list. No preamble.";
  if (/\b(json|object|schema|data structure)\b/.test(t))
    return "Return valid JSON only. No prose.";
  if (/\b(summariz|summary|brief|overview)\b/.test(t))
    return "Return a concise summary in 2–3 sentences.";
  if (/\b(explain|what is|how does)\b/.test(t))
    return "Explain clearly in plain language. Use examples where helpful.";
  return "Be concise and direct. Return only what was asked.";
}

function buildPhases(prompt: string): string[] {
  const lines = prompt.split("\n").filter(Boolean);
  const third = Math.ceil(lines.length / 3);
  return [
    `Phase 1 — Orientation\n\n${lines.slice(0, third).join("\n")}`,
    `Phase 2 — Execution\n\n${lines.slice(third, third * 2).join("\n")}`,
    `Phase 3 — Finalize\n\n${lines.slice(third * 2).join("\n")}`,
  ];
}

export function optimizeForClaude(
  raw: string,
  modelId: string,
  repo: RepoContext | undefined,
  tone: PromptTone,
  outputMode: OutputMode
): OptimizationResult {
  const notes: string[] = [];
  let prompt = raw.trim();
  const model = getModelMeta("claude", modelId);
  const isHaiku = model?.tier === "fast";
  const isOpus = modelId.includes("opus");

  // 1. Role injection
  if (!/^you are\s/i.test(prompt)) {
    const role = inferRole(prompt);
    prompt = `You are a ${role}.\n\n${prompt}`;
    notes.push(`Added role statement: "You are a ${role}."`);
  }

  // 2. Positive reframing
  let negativeCount = 0;
  for (const [pattern, replacer] of NEGATIVE_PATTERNS) {
    const before = prompt;
    prompt = prompt.replace(pattern, replacer as Parameters<typeof prompt.replace>[1]);
    if (prompt !== before) negativeCount++;
  }
  if (negativeCount > 0) {
    notes.push(`Reframed ${negativeCount} negative instruction(s) as positive directives.`);
  }

  // 3. Tone application (before XML wrapping so it affects the content)
  if (tone === "direct") {
    let stripped = false;
    for (const pattern of PLEASANTRY_PATTERNS) {
      const before = prompt;
      prompt = prompt.replace(pattern, "");
      if (prompt !== before) stripped = true;
    }
    if (stripped) notes.push("Stripped conversational pleasantries (direct tone).");
  } else if (tone === "thorough") {
    prompt += "\n\nExplain your reasoning at each step.";
    notes.push("Added reasoning explanation request (thorough tone).");
  } else if (tone === "collaborative") {
    prompt += "\n\nStop and ask if you reach a decision point where you need more context.";
    notes.push("Added checkpoint instruction (collaborative tone).");
  } else if (tone === "aggressive") {
    prompt += "\n\nChallenge my approach if you see a better path. Be direct.";
    notes.push("Added challenge instruction (aggressive tone).");
  }

  // 4. Output spec
  if (!hasOutputSpec(prompt)) {
    const spec = inferOutputSpec(prompt);
    prompt += `\n\n${spec}`;
    notes.push(`Added output specification: "${spec}"`);
  }

  // 5. Chain-of-thought (Sonnet/Opus only, complex tasks)
  if (!isHaiku && isComplexTask(prompt)) {
    prompt += "\n\nThink through this step by step before responding.";
    notes.push("Added chain-of-thought trigger (complex task detected).");
  }

  // 6. Opus depth
  if (isOpus) {
    prompt += "\n\nConsider the tradeoffs between approaches before deciding.";
    notes.push("Added tradeoff consideration (Opus mode).");
  }

  // 7. Repo context
  if (repo) {
    const contextBlock = repo.isClaudeCode
      ? `You are Claude Code, an AI assistant helping with software engineering tasks in this repository. Read the file structure and existing patterns before making changes. Follow the conventions already established in the codebase.\n\n<context>\nRepository: ${repo.url}${repo.stack ? `\nStack: ${repo.stack}` : ""}${repo.description ? `\nDescription: ${repo.description}` : ""}\n</context>\n\n`
      : `<context>\nRepository: ${repo.url}${repo.stack ? `\nStack: ${repo.stack}` : ""}${repo.description ? `\nDescription: ${repo.description}` : ""}\n</context>\n\n`;
    prompt = contextBlock + prompt;
    notes.push(
      repo.isClaudeCode
        ? "Added Claude Code preamble and repository context."
        : "Injected repository context."
    );
  }

  // 8. XML structure (not Haiku, multi-component prompts)
  if (!isHaiku && !repo) {
    const hasMultipleComponents =
      prompt.split("\n\n").filter((p) => p.trim().length > 20).length >= 2;
    if (hasMultipleComponents && !prompt.includes("<instructions>")) {
      const paragraphs = prompt.split("\n\n").filter(Boolean);
      if (paragraphs.length >= 2) {
        const roleAndContext = paragraphs.slice(0, 1).join("\n\n");
        const instructions = paragraphs.slice(1, -1).join("\n\n");
        const outputFmt = paragraphs[paragraphs.length - 1];
        if (instructions) {
          prompt = `${roleAndContext}\n\n<instructions>\n${instructions}\n</instructions>\n\n<output_format>\n${outputFmt}\n</output_format>`;
          notes.push("Wrapped in XML structure (<instructions>, <output_format>).");
        }
      }
    }
  }

  // 9. Haiku strip-down
  if (isHaiku) {
    prompt = prompt.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n");
    notes.push("Stripped XML and simplified for Haiku (fast mode).");
  }

  // 10. Phased output
  if (outputMode === "phased") {
    const phases = buildPhases(prompt);
    notes.push("Split into 3 execution phases.");
    return { prompt: phases, phaseLabels: ["Orientation", "Execution", "Finalize"], mode: "phased", notes };
  }

  return { prompt, mode: "single", notes };
}
