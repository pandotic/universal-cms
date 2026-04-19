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

const COT_PATTERNS = [
  /think\s+(step[s]?\s+by\s+step|through|carefully)/gi,
  /reason\s+through/gi,
  /walk\s+me\s+through/gi,
  /let'?s\s+think/gi,
];

function stripXmlTags(text: string): string {
  return text
    .replace(/<context>([\s\S]*?)<\/context>/gi, "$1")
    .replace(/<instructions>([\s\S]*?)<\/instructions>/gi, "$1")
    .replace(/<constraints>([\s\S]*?)<\/constraints>/gi, "Constraints: $1")
    .replace(/<examples>([\s\S]*?)<\/examples>/gi, "Examples:\n$1")
    .replace(/<output_format>([\s\S]*?)<\/output_format>/gi, "Return: $1")
    .replace(/<[^>]+>/g, "");
}

function inferRole(text: string): string {
  const t = text.toLowerCase();
  if (/\b(code|function|class|typescript|javascript|python|sql|api|bug)\b/.test(t))
    return "senior software engineer";
  if (/\b(write|draft|article|blog|copy|content|email)\b/.test(t))
    return "expert technical writer";
  if (/\b(data|analyz|dataset|csv|chart|metric)\b/.test(t))
    return "data analyst";
  if (/\b(review|audit|security)\b/.test(t))
    return "senior engineer doing a code review";
  if (/\b(seo|keyword|ranking|search)\b/.test(t))
    return "SEO specialist";
  return "expert assistant";
}

function hasOutputSpec(text: string): boolean {
  return /\b(return|output|format|in\s+(json|markdown|plain|bullet|numbered)|no\s+(preamble|explanation|prose|markdown))/i.test(
    text
  );
}

function inferOutputSpec(text: string): string {
  const t = text.toLowerCase();
  if (/\b(code|function|class|implement)\b/.test(t))
    return "Return only the code. No explanation. No preamble.";
  if (/\b(list|enumerate|options|alternatives)\b/.test(t))
    return "Return a numbered list. No preamble.";
  if (/\b(json|object|schema)\b/.test(t))
    return "Return valid JSON only. No prose.";
  if (/\b(summariz|summary|brief|overview)\b/.test(t))
    return "Return a concise summary in 2–3 sentences. No preamble.";
  return "No preamble. Answer directly.";
}

function isCodeOrDataTask(text: string): boolean {
  return /\b(code|function|class|implement|json|sql|query|script)\b/i.test(text);
}

export function optimizeForOpenAI(
  raw: string,
  modelId: string,
  repo: RepoContext | undefined,
  tone: PromptTone,
  outputMode: OutputMode
): OptimizationResult {
  const notes: string[] = [];
  let prompt = raw.trim();
  const model = getModelMeta("openai", modelId);
  const isReasoning = model?.isReasoningModel === true;
  const isMini = modelId === "gpt-4o-mini";

  // 1. Strip XML → plain prose
  if (/<[a-z]+>/.test(prompt)) {
    prompt = stripXmlTags(prompt);
    notes.push("Converted XML tags to plain prose (OpenAI prefers flat text).");
  }

  if (isReasoning) {
    // o-series path: concise problem statement, all constraints inline, no role, no CoT
    // Remove role-setting preamble
    prompt = prompt.replace(/^you are an? [\w\s]+\.\s*/i, "").trim();

    // Strip any CoT language
    let cotRemoved = false;
    for (const pattern of COT_PATTERNS) {
      const before = prompt;
      prompt = prompt.replace(pattern, "");
      if (prompt !== before) cotRemoved = true;
    }
    if (cotRemoved) {
      notes.push("Removed chain-of-thought instructions (o-series reasons internally — CoT degrades output).");
    }

    // Strip pleasantries
    for (const pattern of PLEASANTRY_PATTERNS) {
      prompt = prompt.replace(pattern, "");
    }

    // Clean up whitespace artifacts
    prompt = prompt.replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

    // Add output spec inline if missing
    if (!hasOutputSpec(prompt)) {
      const spec = inferOutputSpec(prompt);
      prompt = `${prompt} ${spec}`;
      notes.push(`Added inline output specification: "${spec}"`);
    }

    notes.push(`Optimized for ${modelId}: concise problem statement, all constraints inline.`);

    // Repo context inline for reasoning models
    if (repo) {
      prompt = `Context: ${repo.url}${repo.stack ? `, stack: ${repo.stack}` : ""}${repo.description ? `. ${repo.description}` : ""}. ${prompt}`;
      notes.push("Inlined repository context (reasoning model prefers flat context).");
    }

    return { prompt, mode: "single", notes };
  }

  // GPT-4o / GPT-4o-mini path
  // 2. Role injection (GPT-4o benefits; mini gets simpler role)
  if (!/^you are\s/i.test(prompt)) {
    if (!isMini) {
      const role = inferRole(prompt);
      prompt = `You are a ${role}.\n\n${prompt}`;
      notes.push(`Added role statement: "You are a ${role}."`);
    }
  }

  // 3. Remove CoT from prompts (GPT-4o handles it fine but mini can loop)
  if (isMini) {
    for (const pattern of COT_PATTERNS) {
      prompt = prompt.replace(pattern, "");
    }
  }

  // 4. Tone
  if (tone === "direct") {
    for (const pattern of PLEASANTRY_PATTERNS) {
      prompt = prompt.replace(pattern, "");
    }
  } else if (tone === "thorough") {
    prompt += "\n\nBe thorough. Explain your reasoning.";
    notes.push("Added thoroughness instruction.");
  } else if (tone === "collaborative") {
    prompt += "\n\nIf you need clarification, ask before proceeding.";
    notes.push("Added clarification request (collaborative tone).");
  } else if (tone === "aggressive") {
    prompt += "\n\nBe direct. Challenge my approach if you see a better path.";
    notes.push("Added challenge instruction (aggressive tone).");
  }

  // 5. Output spec — mandatory for GPT
  if (!hasOutputSpec(prompt)) {
    const spec = inferOutputSpec(prompt);
    prompt += `\n\n${spec}`;
    notes.push(`Added output specification: "${spec}"`);
  }

  // 6. Explicit exclusions for code/data tasks
  if (isCodeOrDataTask(prompt) && !/no\s+(explanation|preamble|prose)/i.test(prompt)) {
    prompt += " No explanation. No preamble.";
    notes.push("Added explicit exclusions (no explanation/preamble) for code/data task.");
  }

  // 7. GPT-4o mini simplification
  if (isMini) {
    const words = prompt.split(/\s+/).length;
    if (words > 80) {
      notes.push("Note: GPT-4o mini works best with shorter prompts — consider simplifying.");
    }
    prompt = prompt.replace(/\n{3,}/g, "\n\n");
  }

  // 8. Repo context
  if (repo) {
    const ctxLine = `Repository context: ${repo.url}${repo.stack ? ` (${repo.stack})` : ""}${repo.description ? ` — ${repo.description}` : ""}.`;
    prompt = `${ctxLine}\n\n${prompt}`;
    notes.push("Prepended repository context.");
  }

  // 9. Phased output
  if (outputMode === "phased") {
    const lines = prompt.split("\n").filter(Boolean);
    const third = Math.ceil(lines.length / 3);
    const phases = [
      `Phase 1 — Orientation\n\n${lines.slice(0, third).join("\n")}`,
      `Phase 2 — Execution\n\n${lines.slice(third, third * 2).join("\n")}`,
      `Phase 3 — Finalize\n\n${lines.slice(third * 2).join("\n")}`,
    ];
    notes.push("Split into 3 execution phases.");
    return {
      prompt: phases,
      phaseLabels: ["Orientation", "Execution", "Finalize"],
      mode: "phased",
      notes,
    };
  }

  return { prompt, mode: "single", notes };
}
