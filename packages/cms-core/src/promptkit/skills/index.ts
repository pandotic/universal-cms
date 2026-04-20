import type { LLMProvider } from "../../types/promptkit.js";

export const CLAUDE_SKILL = `# Claude Prompt Optimization Rules

## Core Principles

1. **Role + task in sentence one.** Open with "You are a [role]." then immediately state the task. If the prompt implies a role (e.g., writing code → software engineer), inject it. Format: "You are a [role]. [Task statement]."

2. **XML tags for multi-component prompts.** When a prompt has two or more distinct parts (context + instructions, instructions + constraints, task + examples), wrap them in XML tags. Use: <context>, <instructions>, <constraints>, <examples>, <output_format>. Skip XML for Haiku — use plain imperative sentences.

3. **Positive framing only.** Convert all negative instructions to positive directives. "Don't include preamble" → "Start directly with the answer." "Never use passive voice" → "Write in active voice." "Avoid jargon" → "Use plain language accessible to a non-expert."

4. **Explicit output specification.** The last element of every prompt must specify format, length, and structure. "Return a JSON object with keys: name, type, description." or "Write 3 paragraphs. Use markdown headers. No code blocks." If absent, infer from task type.

5. **Chain-of-thought trigger for complex tasks.** Add "Think through this step by step before responding." for analytical, multi-step, or ambiguous tasks. Apply to Sonnet and Opus only — Haiku should not chain-of-thought for speed reasons.

6. **Context block before instructions.** If background information exists, place it in a <context> block before <instructions>. Claude reads context first and uses it to ground the task. Never mix background into the instruction block.

7. **Examples dramatically improve output.** Use <examples> blocks with 1–3 before/after pairs for tasks involving style, format, or judgment. The format: <example><input>...</input><output>...</output></example>.

8. **Specificity over vagueness.** Replace generic requests with measurable ones. "Write good code" → "Write TypeScript with explicit return types, no any, and JSDoc for exported functions." "Make it concise" → "Keep each paragraph under 4 sentences."

9. **Claude Code preamble for coding sessions.** When repo context is provided with isClaudeCode: true, prepend: "You are Claude Code, an AI assistant helping with software engineering tasks in this repository. Read the file structure and existing patterns before making changes."

10. **Separate background from task.** Background = what you need to know. Task = what you need to do. Never combine them in one run-on paragraph. <context> holds background; <instructions> holds the task.

## Model-Specific Adjustments

### Claude Haiku 4.5 — Fast mode
- Strip all XML tags; use plain prose
- Use imperative sentences: "List 5 options." not "Please provide a list of options."
- No chain-of-thought triggers
- Keep under 200 words total

### Claude Sonnet 4.5 — Balanced mode
- Use XML for prompts with 2+ components
- Chain-of-thought for analytical tasks only
- Agentic task pattern: "Plan your approach, then execute step by step."
- Target 150–400 word prompts

### Claude Opus 4.5 — Deep mode
- Full XML structure for any multi-part prompt
- Add "Consider the tradeoffs between approaches before deciding."
- Depth encouraged: "Provide thorough analysis including edge cases."
- Reasoning guidance: "If you are uncertain, say so explicitly."

## Claude Code Mode

Prepend when isClaudeCode is true:
\`\`\`
You are Claude Code, an AI assistant helping with software engineering tasks in this repository. Read the file structure and existing patterns before making changes. Follow the conventions already established in the codebase.
\`\`\`

Repo context injection pattern:
\`\`\`xml
<context>
Repository: {url}
Stack: {stack}
Description: {description}
</context>
\`\`\`

## XML Tag Reference

- <context> — Background information, repo details, current state
- <instructions> — The actual task to perform
- <constraints> — Hard limits (no libraries, max lines, format requirements)
- <examples> — Before/after pairs demonstrating desired output
- <output_format> — Exact format specification for the response

Full example:
\`\`\`xml
<context>
We're building a Next.js 16 app with Supabase auth. The existing pattern uses client-injection for all data functions.
</context>
<instructions>
Write a TypeScript function that fetches a user's profile from Supabase.
</instructions>
<constraints>
- Use the client-injection pattern: fn(supabase: SupabaseClient, userId: string)
- Return type must be explicit
- Handle the null case explicitly
</constraints>
<output_format>
TypeScript function with JSDoc. No imports needed. No usage example.
</output_format>
\`\`\`

## Anti-Patterns

1. "Help me with my code" → "You are a TypeScript engineer. Review this function and identify type safety issues."
2. "Don't make it too long" → "Keep the response under 150 words."
3. "Make it better" → "Rewrite this paragraph to be clearer and more direct. Remove passive voice."
4. "Write some tests" → "Write Vitest unit tests for the exported functions. Mock external dependencies. Cover the happy path and one error case per function."
5. "Explain this" → "Explain this code to a mid-level developer unfamiliar with this codebase. Focus on why decisions were made, not what each line does."
6. "Can you maybe..." → "Refactor this function to..."
7. "I was wondering if you could..." → "Generate..."
8. "Try to..." → "..."  (drop the hedge entirely)
9. "Do whatever you think is best" → "Choose the approach that minimizes dependencies and is most readable."
10. "Here is my code, let me know what you think" → "You are a senior engineer doing a code review. Identify: (1) correctness issues, (2) performance problems, (3) missing error handling. Format as a numbered list."
`;

export const GEMINI_SKILL = `# Gemini Prompt Optimization Rules

## Core Principles

1. **Task-first imperative openers.** Start with the action verb, not role-setting. "Analyze this dataset." not "You are a data analyst. Please analyze..." Gemini responds better to direct task framing than persona injection.

2. **Markdown structure over XML.** Use ## headers, numbered lists, and --- dividers for multi-part prompts. Never use XML tags — Gemini treats them as literal text to reproduce rather than structural markers.

3. **Explicit context window invocation.** For Pro and long prompts, add: "Use your full context window to analyze the complete input before responding." This activates Gemini's 1M-token advantage.

4. **Thinking mode triggers for Pro.** For complex analytical tasks on Gemini 2.5 Pro, add: "Think carefully through each step before responding." For Flash: omit — thinking mode adds latency without proportional gain on simple tasks.

5. **Grounding instruction for factual tasks.** For any fact-checking or current-events task: "Base your response only on verifiable information. If uncertain, say so explicitly rather than guessing."

6. **Structured JSON output with schema.** Gemini excels at structured output. For any data extraction: "Return a JSON object matching this schema exactly: {schema}. No prose, no markdown wrapper."

7. **Negative examples help more than with Claude.** Include "Do not..." examples alongside positive ones. Gemini's output quality improves significantly with explicit anti-patterns demonstrated.

8. **Reasoning depth calibration.** Flash: "Give a direct answer." Pro: "Provide a thorough analysis." 2.0 Flash: "Answer concisely." Calibrating this prevents over-explanation on fast models.

9. **Multimodal specificity.** For image/video prompts: be explicit about what to focus on. "Describe the structural elements in this diagram, ignoring decorative styling." Not: "What do you see?"

10. **No over-scaffolding for simple tasks.** A simple question doesn't need sections or headers. Add structure only when the task has genuinely distinct components.

## Model-Specific Adjustments

### Gemini 2.0 Flash — Speed mode
- Direct imperative, no thinking trigger
- No context window invocation
- Keep prompt under 100 words
- "Answer concisely."

### Gemini 2.5 Flash — Balanced mode
- Add thinking trigger for tasks requiring inference or multi-step reasoning
- Markdown structure for 2+ components
- Context window invoke only for truly long inputs

### Gemini 2.5 Pro — Deep mode
- Always add context window invocation for long prompts
- Full thinking trigger for analytical tasks
- Use ## headers to separate context, task, constraints, output format
- "Leverage the full context provided before concluding."

## Prompt Structure Template

\`\`\`
## Task
[Imperative task statement]

## Context
[Background information]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Output Format
[Exact format specification]
\`\`\`

## Anti-Patterns

1. "You are an expert..." → Start with the task directly: "Analyze..."
2. "<context>...</context>" → "## Context\n..."
3. "Please could you help me..." → "Extract..."
4. "Think step by step" (on Flash) → omit; use only on Pro
5. "Use your knowledge to..." → Just state the task; Gemini uses its knowledge by default
6. "Be creative" → "Generate 3 distinct approaches, each with a different tradeoff"
7. "Summarize the above" (without structure) → "## Task\nSummarize the document above. ## Output Format\nBullet points, max 5. Each point under 20 words."
8. "Answer in JSON" (no schema) → "Return JSON matching this schema exactly: {...}"
9. Long XML-structured prompt → Convert all XML to Markdown ## headers
10. "Do your best" → "Prioritize accuracy over completeness. If uncertain, say so."
`;

export const OPENAI_SKILL = `# OpenAI / GPT Prompt Optimization Rules

## Core Principles

1. **System vs user message framing.** GPT models are tuned for system + user message pairs. The system message sets persona and constraints; the user message states the task. In single-prompt mode: start with role/persona, then task, then format constraints.

2. **Reasoning models (o3/o4) need concise problem statements only.** Do NOT add chain-of-thought instructions, step-by-step guidance, or "think carefully" to o-series models. They reason internally. Adding CoT instructions degrades output. State the problem concisely with all constraints inline.

3. **GPT-4o needs explicit format specification.** GPT-4o will prose-ify output without format constraints. Every prompt must end with explicit format: "Return as JSON.", "Use markdown headers.", "Plain text, no lists.", "Exactly 3 sentences."

4. **Format specification is mandatory.** Without it, GPT defaults to verbose prose regardless of task type. Be explicit: "No preamble.", "No explanation.", "No code fences.", "No markdown."

5. **Few-shot examples dramatically help GPT-4o.** For pattern-following tasks (extraction, classification, reformatting), include 1–2 input/output examples. GPT-4o's pattern-matching is exceptional. Format: "Input: ... Output: ..."

6. **Explicit exclusions for code/structured output.** GPT tends to wrap code in explanatory prose. For code/JSON tasks: "Return only the code." "No explanation." "No preamble." "Start directly with the function definition."

7. **Length calibration.** GPT defaults verbose. Add length constraints for any response where brevity matters: "In one paragraph.", "Under 100 words.", "Maximum 5 bullet points."

8. **Tool use prompting patterns.** When describing functions for tool use: be explicit about when NOT to call a tool. "Only call search_web if the answer requires current information. Otherwise answer directly."

9. **o-series: all constraints upfront.** For o3/o4, move every constraint into the problem statement. No trailing instructions — the model reasons through the full problem before generating. "Solve X. Constraints: Y, Z. Return: [format]."

10. **Temperature guidance in prompt text.** When you need deterministic output: "Return the single most likely answer. Do not offer alternatives." For creative: "Generate 3 distinct variations, each with a different approach."

## Model-Specific Adjustments

### GPT-4o — Versatile mode
- Role statement at top: "You are a [role]."
- Benefits strongly from 1–2 few-shot examples
- Always add length + format constraints
- "No preamble. No explanation. [Format]."

### o3 — Deep reasoning mode
- NO role statement
- NO chain-of-thought instructions
- NO "think step by step"
- Concise problem statement with all constraints inline
- All format requirements in the problem statement itself
- Trust the model to reason; your job is to define the problem precisely

### o4-mini — Fast reasoning mode
- Same rules as o3
- Slightly more concise than o3 prompts
- Good for coding tasks where o3 is overkill

### GPT-4o mini — Fast mode
- Very explicit required — less instruction-following capability
- Short, imperative prompts only
- No complex multi-step instructions
- Simple format specifications only

## Prompt Structure Templates

### GPT-4o template
\`\`\`
You are a [role].

[Task statement.]

[1-2 examples if pattern-based:]
Input: ...
Output: ...

[Format constraints:]
Return [format]. No preamble. No explanation.
\`\`\`

### o3/o4-mini template
\`\`\`
[Concise problem statement. All constraints inline. Return [exact format].]
\`\`\`

## Anti-Patterns

1. "Think step by step" (on o3) → remove entirely; o3 reasons internally
2. "You are an expert" (on o3) → remove; just state the problem
3. "Please provide a detailed explanation..." (on GPT-4o without format) → "Explain X. Return 3 bullet points, each under 20 words."
4. "Write code for..." (no exclusions) → "Write code for X. Return only the code. No explanation. No markdown fences."
5. "Return JSON" (no schema) → "Return JSON: {\"key\": \"string\", \"count\": number}"
6. Multi-paragraph prompt on GPT-4o mini → Reduce to 1–2 sentences
7. "Do your best and let me know if you need more info" → Remove; state all requirements upfront
8. XML-structured prompt → Convert to plain prose with inline constraints
9. "Feel free to be creative" → "Generate 3 variations. Each must use a different tone."
10. "Here's some context: [500 words]... What do you think?" → Extract the actual question, state it first, then provide context
`;

export const SKILLS: Record<LLMProvider, string> = {
  claude: CLAUDE_SKILL,
  gemini: GEMINI_SKILL,
  openai: OPENAI_SKILL,
};

export function getSkill(provider: LLMProvider): string {
  return SKILLS[provider] ?? "";
}

export const SKILL_META: Record<
  LLMProvider,
  { filename: string; title: string }
> = {
  claude: { filename: "claude.md", title: "Claude Optimization Rules" },
  gemini: { filename: "gemini.md", title: "Gemini Optimization Rules" },
  openai: { filename: "openai.md", title: "OpenAI / GPT Optimization Rules" },
};
