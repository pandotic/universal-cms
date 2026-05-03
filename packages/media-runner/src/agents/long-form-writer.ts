// Long-Form Writer dispatch — the PR 2 pilot.
//
// On `--enqueue`, the helper writes a hub_agent_runs row with
// result.input populated:
//
//   {
//     mode: "long_form_writer",
//     property_id: "...",
//     property_slug: "speed",
//     topic: "Toxin-free sunscreen for kids",
//     target_keyword: "toxin free sunscreen",
//     secondary_keywords: ["mineral sunscreen", ...],
//     brand_voice: { ... },           // serialized voice brief
//     brand_assets: { ... },          // boilerplate, NAP, etc.
//     playbook: { ... },              // active playbook config
//   }
//
// The runner pulls that, builds a kickoff prompt, and lets the Managed
// Agent draft. On idle, the final agent message is parsed (expects JSON
// matching WritePayload from long-form-writer-helper.ts) and inserted
// into hub_content_pipeline.

import type { ClaimedRun } from "../poll.js";

export interface LongFormWriterInput {
  property_id: string;
  property_slug: string;
  topic: string;
  target_keyword: string;
  secondary_keywords?: string[];
  brand_voice?: Record<string, unknown> | null;
  brand_assets?: Record<string, unknown> | null;
  playbook?: Record<string, unknown> | null;
  word_count_target?: number;
}

export function parseLongFormInput(run: ClaimedRun): LongFormWriterInput {
  const i = run.input as Partial<LongFormWriterInput>;
  if (!i || typeof i !== "object") {
    throw new Error(`run ${run.run_id}: result.input is missing or not an object`);
  }
  if (typeof i.topic !== "string" || i.topic.trim().length === 0) {
    throw new Error(`run ${run.run_id}: result.input.topic is required`);
  }
  if (typeof i.target_keyword !== "string" || i.target_keyword.trim().length === 0) {
    throw new Error(`run ${run.run_id}: result.input.target_keyword is required`);
  }
  return {
    property_id: i.property_id ?? run.property_id,
    property_slug: typeof i.property_slug === "string" ? i.property_slug : "",
    topic: i.topic,
    target_keyword: i.target_keyword,
    secondary_keywords: Array.isArray(i.secondary_keywords) ? i.secondary_keywords : [],
    brand_voice: i.brand_voice ?? null,
    brand_assets: i.brand_assets ?? null,
    playbook: i.playbook ?? null,
    word_count_target: typeof i.word_count_target === "number" ? i.word_count_target : 2000,
  };
}

export function buildLongFormKickoff(run: ClaimedRun): string {
  const input = parseLongFormInput(run);

  const sections = [
    `You are drafting a long-form blog post for the property "${input.property_slug}".`,
    "",
    `Topic: ${input.topic}`,
    `Target keyword: ${input.target_keyword}`,
    input.secondary_keywords && input.secondary_keywords.length > 0
      ? `Secondary keywords: ${input.secondary_keywords.join(", ")}`
      : "",
    `Word count target: ${input.word_count_target}`,
    "",
    "Brand voice:",
    "```json",
    JSON.stringify(input.brand_voice ?? {}, null, 2),
    "```",
    "",
    "Brand assets:",
    "```json",
    JSON.stringify(input.brand_assets ?? {}, null, 2),
    "```",
    "",
    "Playbook:",
    "```json",
    JSON.stringify(input.playbook ?? {}, null, 2),
    "```",
    "",
    "When you're ready, output a single ```json fenced block with this shape:",
    "```json",
    "{",
    '  "title": "string",',
    '  "excerpt": "string (under 200 chars)",',
    '  "body": "string (full markdown body)",',
    '  "metadata": {',
    '    "brief": "one-paragraph summary of approach",',
    '    "target_keyword": "string",',
    '    "secondary_keywords": ["string"],',
    '    "estimated_read_time_min": 8',
    "  }",
    "}",
    "```",
    "",
    "After emitting that JSON block, end your turn.",
  ].filter((s) => s !== "");

  return sections.join("\n");
}

export interface LongFormPayload {
  title: string;
  excerpt: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export function extractLongFormPayload(text: string): LongFormPayload {
  const fenced = text.match(/```json\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1]! : text;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `final agent message did not contain valid JSON: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("final agent payload is not an object");
  }
  const p = parsed as Record<string, unknown>;
  if (typeof p.title !== "string" || p.title.trim().length === 0) {
    throw new Error("payload.title is required");
  }
  if (typeof p.excerpt !== "string" || p.excerpt.trim().length === 0) {
    throw new Error("payload.excerpt is required");
  }
  if (typeof p.body !== "string" || p.body.trim().length === 0) {
    throw new Error("payload.body is required");
  }
  return {
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    metadata:
      p.metadata && typeof p.metadata === "object" && !Array.isArray(p.metadata)
        ? (p.metadata as Record<string, unknown>)
        : undefined,
  };
}
