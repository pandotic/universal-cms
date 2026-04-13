# PromptKit — Claude Code Build Spec
## Full React App: AI Prompt Optimizer + Builder

---

## BEFORE YOU WRITE ANY CODE

1. Read `/mnt/skills/public/frontend-design/SKILL.md` — this governs all visual decisions.
2. Read any Claude or Gemini skill files present in the project root under `/skills/` or `.claude/skills/` — these contain model-specific prompt optimization rules you will reference at runtime.
3. Run `ls -la` to check existing project state. Do not overwrite existing files without confirming.
4. After reading skills, confirm your understanding by listing the top 3 prompt optimization rules for Claude and top 3 for Gemini before writing any component code.

---

## PROJECT OVERVIEW

**App name:** PromptKit  
**Purpose:** A fast, focused prompt optimization tool. The user selects their target LLM and model, optionally links a GitHub repo for project context, writes or pastes a rough prompt, and gets back a polished, model-optimized version they can copy and use immediately.  
**Stack:** React + TypeScript + Vite  
**Persistence:** localStorage (prompt history + favorites, no backend required)  
**Deployment:** Netlify or GitHub Pages (static)

The app has two primary modes:
- **Quick mode** — single-screen, fast: pick LLM → pick model → write prompt → get optimized output. Used 90% of the time.
- **Builder mode** — structured: define goal, add sections, set constraints, get a phased or single prompt. Used for complex Claude Code prompts.

---

## STACK & SETUP

```bash
npm create vite@latest promptkit -- --template react-ts
cd promptkit
npm install
npm install tailwindcss @tailwindcss/vite lucide-react
```

Configure Tailwind in `vite.config.ts`. Use Tailwind utility classes throughout — no CSS modules, no styled-components.

Directory structure:
```
src/
  components/
    layout/
      Sidebar.tsx
      Header.tsx
    quick/
      LLMSelector.tsx
      ModelPicker.tsx
      RepoInput.tsx
      PromptInput.tsx
      OptimizedOutput.tsx
    builder/
      GoalContext.tsx
      SectionEditor.tsx
      ConstraintsPanel.tsx
      PhaseOutput.tsx
    shared/
      CopyButton.tsx
      Badge.tsx
      Toggle.tsx
      HistoryDrawer.tsx
  hooks/
    usePromptHistory.ts
    useOptimizer.ts
    useRepoContext.ts
  lib/
    optimizers/
      claude.ts
      gemini.ts
      openai.ts
      index.ts
    models.ts
    storage.ts
    types.ts
  skills/          ← skill files live here, loaded at runtime
    claude.md      ← Claude prompt optimization rules
    gemini.md      ← Gemini prompt optimization rules
  App.tsx
  main.tsx
```

---

## TYPES — define these first in `src/lib/types.ts`

```typescript
export type LLMProvider = 'claude' | 'gemini' | 'openai' | 'grok';

export type ClaudeModel =
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'
  | 'claude-opus-4'
  | 'claude-sonnet-4';

export type GeminiModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o3'
  | 'o4-mini';

export type ModelId = ClaudeModel | GeminiModel | OpenAIModel | string;

export interface LLMTarget {
  provider: LLMProvider;
  model: ModelId;
}

export interface RepoContext {
  url: string;           // github.com/user/repo
  description?: string;  // auto-populated or user-written
  stack?: string;        // e.g. "React + TypeScript + Supabase"
  isClaudeCode: boolean; // changes optimization strategy
}

export interface PromptSection {
  id: string;
  title: string;
  body: string;
  order: number;
}

export type OutputMode = 'single' | 'phased';
export type PromptTone = 'direct' | 'thorough' | 'collaborative' | 'aggressive';

export interface PromptConfig {
  id: string;
  mode: 'quick' | 'builder';
  target: LLMTarget;
  repo?: RepoContext;
  // quick mode
  rawPrompt?: string;
  // builder mode
  goal?: string;
  subject?: string;
  sections?: PromptSection[];
  constraints?: string;
  tone?: PromptTone;
  deliverable?: string;
  outputMode?: OutputMode;
  // output
  optimizedPrompt?: string | string[];  // string[] for phased
  createdAt: number;
  isFavorite?: boolean;
  label?: string;
}

export interface OptimizationResult {
  prompt: string | string[];  // string[] = phased prompts
  phaseLabels?: string[];
  mode: OutputMode;
  notes?: string[];           // "why we made these changes" bullets
}
```

---

## MODEL REGISTRY — `src/lib/models.ts`

Define all supported models with metadata. This drives both the UI and the optimizer.

```typescript
export interface ModelMeta {
  id: ModelId;
  label: string;
  contextWindow: string;   // human-readable, e.g. "200K"
  strengths: string[];     // drives optimization hints
  bestFor: string[];
  supportsTools: boolean;
  supportsVision: boolean;
  tier: 'flagship' | 'balanced' | 'fast';
  badge?: string;          // e.g. "Best for code", "Fastest"
}

export const MODELS: Record<LLMProvider, ModelMeta[]> = {
  claude: [
    {
      id: 'claude-opus-4-5',
      label: 'Claude Opus 4.5',
      contextWindow: '200K',
      strengths: ['complex reasoning', 'long context', 'nuanced instruction following'],
      bestFor: ['deep research', 'complex codebases', 'multi-step planning'],
      supportsTools: true,
      supportsVision: true,
      tier: 'flagship',
      badge: 'Most powerful',
    },
    {
      id: 'claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5',
      contextWindow: '200K',
      strengths: ['speed + intelligence balance', 'coding', 'agentic tasks'],
      bestFor: ['everyday coding', 'Claude Code sessions', 'production use'],
      supportsTools: true,
      supportsVision: true,
      tier: 'balanced',
      badge: 'Recommended',
    },
    {
      id: 'claude-haiku-4-5',
      label: 'Claude Haiku 4.5',
      contextWindow: '200K',
      strengths: ['speed', 'cost efficiency', 'simple tasks'],
      bestFor: ['quick queries', 'high-volume use', 'simple rewrites'],
      supportsTools: true,
      supportsVision: false,
      tier: 'fast',
      badge: 'Fastest',
    },
  ],
  gemini: [
    {
      id: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      contextWindow: '1M',
      strengths: ['massive context', 'multimodal', 'reasoning'],
      bestFor: ['huge codebases', 'video/image analysis', 'complex reasoning'],
      supportsTools: true,
      supportsVision: true,
      tier: 'flagship',
      badge: '1M context',
    },
    {
      id: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      contextWindow: '1M',
      strengths: ['fast', 'cost efficient', 'thinking mode'],
      bestFor: ['rapid iteration', 'quick tasks', 'most everyday use'],
      supportsTools: true,
      supportsVision: true,
      tier: 'balanced',
      badge: 'Recommended',
    },
    {
      id: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      contextWindow: '1M',
      strengths: ['speed', 'reliability'],
      bestFor: ['fast responses', 'simple tasks'],
      supportsTools: true,
      supportsVision: true,
      tier: 'fast',
    },
  ],
  openai: [
    {
      id: 'gpt-4o',
      label: 'GPT-4o',
      contextWindow: '128K',
      strengths: ['versatile', 'multimodal', 'broad knowledge'],
      bestFor: ['general tasks', 'creative work', 'analysis'],
      supportsTools: true,
      supportsVision: true,
      tier: 'flagship',
      badge: 'Most versatile',
    },
    {
      id: 'o3',
      label: 'o3',
      contextWindow: '200K',
      strengths: ['deep reasoning', 'math', 'complex problem solving'],
      bestFor: ['hard reasoning tasks', 'math', 'science'],
      supportsTools: true,
      supportsVision: true,
      tier: 'flagship',
      badge: 'Best reasoning',
    },
    {
      id: 'gpt-4o-mini',
      label: 'GPT-4o mini',
      contextWindow: '128K',
      strengths: ['speed', 'cost'],
      bestFor: ['quick tasks', 'high volume'],
      supportsTools: true,
      supportsVision: true,
      tier: 'fast',
      badge: 'Fastest',
    },
  ],
  grok: [],
};

export const LLM_META = {
  claude: { label: 'Claude', color: 'orange', icon: '◆', company: 'Anthropic' },
  gemini: { label: 'Gemini', color: 'blue', icon: '✦', company: 'Google' },
  openai: { label: 'ChatGPT / OpenAI', color: 'green', icon: '◉', company: 'OpenAI' },
  grok: { label: 'Grok', color: 'gray', icon: '✕', company: 'xAI' },
};
```

---

## SKILL LOADER — `src/lib/skillLoader.ts`

Skills are Markdown files in `src/skills/`. Load them at startup and cache. The optimizer functions reference the loaded text to build system prompts.

```typescript
// Load skill files at startup
// Files: src/skills/claude.md, src/skills/gemini.md, etc.
// Vite can import ?raw to get file contents as strings

import claudeSkill from '../skills/claude.md?raw';
import geminiSkill from '../skills/gemini.md?raw';

export const SKILLS: Record<string, string> = {
  claude: claudeSkill,
  gemini: geminiSkill,
};

export function getSkill(provider: LLMProvider): string {
  return SKILLS[provider] ?? '';
}
```

**IMPORTANT:** When the skill files don't yet exist in `src/skills/`, create placeholder files with the core known rules for each model (see Optimizer section below for what to include). The app is designed so that updating the skill `.md` files immediately updates optimization behavior without code changes.

---

## OPTIMIZER ENGINE — `src/lib/optimizers/`

This is the core of the app. Each optimizer takes a raw prompt + config and returns an optimized version. The optimizer uses the skill file content as its knowledge base.

### `src/lib/optimizers/claude.ts`

The Claude optimizer should apply these rules (embed them also in `src/skills/claude.md`):

**Claude prompt optimization rules:**
1. **Role + task upfront.** Claude performs best when the first sentence establishes who it is and what the core task is. Not "Please can you..." — "You are a [role]. Your task is to [verb] [object]."
2. **Positive instructions over negatives.** Replace "don't do X" with "do Y instead." Claude follows positive framing more reliably.
3. **XML tags for structure.** Use `<context>`, `<instructions>`, `<examples>`, `<output_format>` tags when the prompt has multiple components. Claude is explicitly trained on XML-delimited prompts.
4. **Explicit output format.** Always end with a concrete output spec: format (JSON, markdown, prose), length guidance, and any structure requirements.
5. **For Claude Code:** Add "Read files before modifying. Prefer small verifiable steps. Stop and ask when hitting decision points." Prepend with repository context block if a repo is provided.
6. **Chain of thought.** For complex tasks, add "Think through this step by step before responding" or "Before answering, reason through [X]."
7. **Separate system from user context.** If the prompt has background info, put it in a `<context>` block before the instructions.
8. **Haiku optimization:** Be more terse. Short sentences. No elaborate role-setting needed. Just the task.
9. **Opus optimization:** Can handle complex multi-part instructions. Use numbered lists for multi-step tasks. More instruction depth is rewarded.
10. **Sonnet optimization:** Balanced. Clear structure. Not too long. Works well for agentic tasks with tool use.

```typescript
export function optimizeForClaude(
  rawPrompt: string,
  model: ClaudeModel,
  repo: RepoContext | undefined,
  skill: string,
  mode: OutputMode
): OptimizationResult {
  // Build optimized prompt using rules from skill file + model tier
  // Return OptimizationResult with prompt + notes explaining changes
}
```

### `src/lib/optimizers/gemini.ts`

**Gemini prompt optimization rules (embed in `src/skills/gemini.md`):**
1. **Task-first, direct.** Gemini responds well to imperative sentence openers: "Analyze...", "Generate...", "Compare...". Skip elaborate role-setting.
2. **Leverage the context window explicitly.** For Gemini 2.5 Pro/Flash, include a note like "Use the full context provided." Gemini often doesn't use its context window deeply unless prompted to.
3. **Structured output instructions.** Specify JSON output format with explicit schema when you want structured data — Gemini handles this reliably.
4. **Step-by-step for reasoning.** Add "Think step by step" or "Reason through this carefully" — Gemini's thinking mode benefits from explicit triggers.
5. **Multimodal awareness.** If the prompt involves images/video, add explicit instruction about what to analyze in each modality.
6. **Avoid overly elaborate XML.** Unlike Claude, Gemini doesn't have special XML tag training. Use markdown headers (`##`) or plain numbered sections instead.
7. **Grounding instruction.** For factual prompts, add "Use only information you are certain about. If uncertain, say so." Gemini can confabulate confidently.
8. **Flash optimization:** Brief prompts. Use bullet points. Flash is fast but doesn't need elaborate scaffolding.
9. **Pro optimization:** Can handle very long, complex prompts. Great for "analyze this entire codebase and..." style prompts. Use explicit multi-step instructions.
10. **Negative example.** Gemini benefits from "Here is an example of what NOT to do: [example]" more than Claude does.

### `src/lib/optimizers/index.ts`

```typescript
export function optimizePrompt(
  rawPrompt: string,
  config: PromptConfig,
  skills: Record<string, string>
): OptimizationResult {
  const { provider, model } = config.target;
  const skill = skills[provider] ?? '';

  switch (provider) {
    case 'claude': return optimizeForClaude(rawPrompt, model as ClaudeModel, config.repo, skill, config.outputMode ?? 'single');
    case 'gemini': return optimizeForGemini(rawPrompt, model as GeminiModel, config.repo, skill, config.outputMode ?? 'single');
    case 'openai': return optimizeForOpenAI(rawPrompt, model as OpenAIModel, config.repo, skill, config.outputMode ?? 'single');
    default: return { prompt: rawPrompt, mode: 'single' };
  }
}
```

**Implementation note:** The optimizer functions are pure TypeScript — no API calls. They apply rule-based transformations to the raw prompt. This keeps the app fast and usable without any API keys. The "intelligence" comes from the rule logic itself, not a live model call. This is intentional for v1 — add API-powered optimization as a future enhancement.

---

## STORAGE — `src/lib/storage.ts`

```typescript
const STORAGE_KEY = 'promptkit_history';
const MAX_HISTORY = 100;

export function savePrompt(config: PromptConfig): void { ... }
export function getHistory(): PromptConfig[] { ... }
export function toggleFavorite(id: string): void { ... }
export function deletePrompt(id: string): void { ... }
export function labelPrompt(id: string, label: string): void { ... }
export function getFavorites(): PromptConfig[] { ... }
export function clearHistory(): void { ... }
```

---

## UI COMPONENTS

### Design system
- Tailwind only. No external component libraries.
- Color scheme: dark sidebar, light main content area.
- LLM providers each have a distinct accent color:
  - Claude: amber/orange (`amber-500`)
  - Gemini: blue (`blue-500`)
  - OpenAI: emerald (`emerald-500`)
  - Grok: neutral gray (`gray-400`)
- Font: system font stack. Monospace for prompt input/output areas.
- Rounded corners: `rounded-lg` for cards, `rounded-full` for pills.
- No shadows — use borders instead (`border border-gray-200` or `border border-gray-700` dark).

### `LLMSelector.tsx` — the most important UI component

Big pill buttons for each LLM, displayed horizontally. Each pill:
- Shows the LLM icon, name, and company
- Has a colored left border in the LLM's accent color when selected
- Shows a subtle "active" background when selected
- Below the selected LLM, model tiles appear immediately (no page change)

```
┌─────────────────────────────────────────────────────────┐
│  ◆ Claude      ✦ Gemini     ◉ ChatGPT     ✕ Grok       │
│  Anthropic     Google       OpenAI        xAI           │
└─────────────────────────────────────────────────────────┘

When Claude is selected:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Opus 4.5     │  │ Sonnet 4.5   │  │ Haiku 4.5    │
│ Most powerful│  │ Recommended ★│  │ Fastest      │
│ 200K ctx     │  │ 200K ctx     │  │ 200K ctx     │
└──────────────┘  └──────────────┘  └──────────────┘
```

The recommended/default model for each provider is pre-selected. User can change it. The selected model affects optimizer behavior.

### `RepoInput.tsx`

Collapsible panel. Off by default. Toggle with a button labeled "Add project context (Claude Code)".

When open:
- Text input for GitHub repo URL (e.g. `github.com/user/repo`)
- Auto-detects if it's a Claude Code session vs regular chat prompt
- Optional text area for: stack description, key notes, current focus
- "Claude Code mode" toggle — when on, the optimizer adds Claude Code-specific preamble ("Read files before modifying. Stop and ask at decision points.")
- Visual badge appears on the main prompt area when a repo is linked

### `PromptInput.tsx`

Large textarea — minimum 8 rows, auto-expands.

Above the textarea:
- Word/character count
- "Mode" toggle: Quick Optimize vs Builder (switches the whole panel below)
- Tone selector: Direct / Thorough / Collaborative / Aggressive

Below the textarea:
- Big primary button: "Optimize for [Model Name]" in the LLM's accent color
- Secondary: "Clear"

Placeholder text changes based on selected LLM:
- Claude: "Write your prompt here. Be rough — we'll structure it for Claude's XML format, add role framing, and tighten the output spec."
- Gemini: "Write your prompt here. We'll add step-by-step triggers, tighten the task framing, and add output format instructions for Gemini."
- OpenAI: "Write your prompt here. We'll optimize structure and clarity for GPT/o-series."

### `OptimizedOutput.tsx`

Appears below (or right of) the input on desktop. 

Components:
- **Phase tabs** (if phased output) — "Phase 1", "Phase 2", "Phase 3"
- **Prompt text** in a monospace read-only textarea with subtle background
- **Copy button** — prominent, shows "Copied!" feedback
- **"What changed" accordion** — collapsed by default, expands to show bulleted list of optimizations applied (from `OptimizationResult.notes`)
- **Word count** and estimated token count (rough: words × 1.3)
- **Open in [LLM]** button — links directly to Claude.ai, Gemini, or ChatGPT with the prompt pre-filled via URL (where supported)
- **Save to history** button

### `HistoryDrawer.tsx`

Slides in from the right. Shows:
- Tabs: "Recent" and "Favorites"
- Each entry shows: LLM badge, model name, first 80 chars of prompt, timestamp
- Click to reload into the main editor
- Star to favorite, trash to delete
- Optional label (click to rename)

### Builder Mode — `SectionEditor.tsx`

When the user switches to Builder mode in the PromptInput area, the lower half expands into the full builder:
- Goal input
- Subject input
- Quick template pills: "Build a feature", "Refactor", "Debug", "Migrate", "Plan & spec", "Code review"
- Dynamic section list (same as the widget we built) — add/remove/edit
- Constraints input
- Output mode: Single vs Phased
- Deliverable description input

The builder feeds into the same optimizer — it assembles the raw prompt from sections, then runs it through the provider's optimizer.

---

## APP LAYOUT — `App.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: PromptKit  [History ↗]  [Settings ⚙]               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SELECT TARGET                                            │
│  ┌ LLMSelector (provider pills + model tiles) ─────────────┐│
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  2. PROJECT CONTEXT (optional, collapsible)                  │
│  ┌ RepoInput ───────────────────────────────────────────────┐│
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  3. YOUR PROMPT                    4. OPTIMIZED OUTPUT       │
│  ┌ PromptInput ──────────────┐   ┌ OptimizedOutput ────────┐│
│  │                           │   │                         ││
│  │  [textarea]               │   │  [phase tabs if phased] ││
│  │                           │   │  [prompt text]          ││
│  │  [Optimize for Sonnet] ──▶│   │  [copy] [open in LLM]  ││
│  └───────────────────────────┘   │  [what changed ▼]       ││
│                                   └─────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

On mobile: stack vertically. LLM selector scrolls horizontally. Output appears below input.

---

## HOOK: `useOptimizer.ts`

```typescript
export function useOptimizer() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimize = useCallback((config: PromptConfig) => {
    setIsOptimizing(true);
    // Small timeout to give "processing" feel — optimizer is synchronous
    setTimeout(() => {
      const output = optimizePrompt(config.rawPrompt ?? '', config, SKILLS);
      setResult(output);
      savePrompt({ ...config, optimizedPrompt: output.prompt });
      setIsOptimizing(false);
    }, 300);
  }, []);

  return { result, isOptimizing, optimize };
}
```

## HOOK: `useRepoContext.ts`

```typescript
// Parses a GitHub URL and extracts owner/repo
// Optionally fetches the README via GitHub's public API (no auth needed for public repos)
// to auto-populate description and detect stack from README content

export function useRepoContext(url: string) {
  const [context, setContext] = useState<RepoContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse: github.com/user/repo → fetch https://api.github.com/repos/user/repo
  // Extract: description, language, topics
  // If public, also fetch README and extract first 500 chars for stack hints

  return { context, isLoading };
}
```

---

## KEYBOARD SHORTCUTS

- `Cmd/Ctrl + Enter` — run optimizer
- `Cmd/Ctrl + Shift + C` — copy output
- `Cmd/Ctrl + K` — open history drawer
- `Escape` — close history drawer
- `1`, `2`, `3` (when output is focused) — switch phase tabs

---

## SETTINGS PAGE

Simple modal/drawer, not a separate route. Contains:
- Default LLM provider (persisted to localStorage)
- Default model per provider (persisted)
- Theme: Light / Dark / System
- Clear history button
- Export history as JSON button
- "About skills" section — shows which skill files are loaded and their last-modified date

---

## SKILL FILES TO CREATE

### `src/skills/claude.md`

Write this file with the full Claude prompt optimization rules as a reference document. Structure it as:

```markdown
# Claude Prompt Optimization Guide

## Core principles
[rules 1-10 from optimizer section above, expanded]

## Model-specific adjustments
### Haiku 4.5
### Sonnet 4.5  
### Opus 4.5

## Claude Code mode
[specific preamble patterns for Claude Code]

## XML tag patterns
[examples of when/how to use XML tags]

## Anti-patterns
[what NOT to do with Claude prompts]
```

### `src/skills/gemini.md`

Same structure for Gemini. Include:
- Task-first framing patterns
- Thinking mode triggers
- Structured output (JSON schema) patterns
- Grounding instructions
- Context window usage triggers
- Model-specific: Flash vs Pro vs 2.0 differences

### `src/skills/openai.md`

- System vs user message patterns
- Reasoning model (o3/o4) vs standard GPT patterns
- Tool use prompting patterns
- Temperature/format guidance

---

## BUILD ORDER

Build in this exact sequence. Do not skip ahead.

**Phase 1 — Foundation**
1. Project scaffolding + Tailwind setup
2. `src/lib/types.ts`
3. `src/lib/models.ts`
4. `src/lib/storage.ts`
5. `src/skills/claude.md` + `src/skills/gemini.md` + `src/skills/openai.md`
6. `src/lib/skillLoader.ts`
7. `src/lib/optimizers/claude.ts`
8. `src/lib/optimizers/gemini.ts`
9. `src/lib/optimizers/openai.ts`
10. `src/lib/optimizers/index.ts`

**Phase 2 — Core UI**
11. `src/hooks/useOptimizer.ts`
12. `src/hooks/useRepoContext.ts`
13. `src/hooks/usePromptHistory.ts`
14. `src/components/shared/` (CopyButton, Badge, Toggle)
15. `src/components/layout/Header.tsx`
16. `src/components/quick/LLMSelector.tsx` ← most important, get this right
17. `src/components/quick/ModelPicker.tsx`
18. `src/components/quick/RepoInput.tsx`
19. `src/components/quick/PromptInput.tsx`
20. `src/components/quick/OptimizedOutput.tsx`
21. `src/App.tsx` — wire everything together

**Phase 3 — Enhanced features**
22. `src/components/shared/HistoryDrawer.tsx`
23. `src/components/builder/` — full builder mode
24. Keyboard shortcuts
25. Settings drawer
26. Mobile responsive pass
27. Dark mode

After each phase, confirm the UI renders correctly and the core optimizer produces meaningfully different output for Claude vs Gemini before moving on.

---

## QUALITY BAR

Before calling this done, verify:

- [ ] Selecting Claude → Sonnet → typing a rough prompt → clicking Optimize produces a prompt with XML tags, role framing, and explicit output format
- [ ] Selecting Gemini → Flash → same rough prompt produces a different, task-first structured output without XML tags
- [ ] The "What changed" section explains at least 3 specific transformations made
- [ ] Adding a repo URL auto-populates description for public GitHub repos
- [ ] Claude Code mode toggle adds the correct preamble to the output
- [ ] Prompt history persists across page reloads
- [ ] Copy button works and shows feedback
- [ ] Phase tabs appear when phased output is generated
- [ ] Mobile layout is usable on 375px viewport
- [ ] Dark mode works without white flash on load

---

## FUTURE ENHANCEMENTS (do not build now, but design for)

- API-powered optimization: send prompt to Claude/Gemini API and have the model optimize it using the skill as a system prompt
- Team workspace: share prompts across a team (needs Supabase)
- Prompt versioning: see history of edits to a single prompt
- A/B output: generate Claude AND Gemini versions side by side
- Browser extension: optimize prompts directly in Claude.ai or Gemini web UI
- MCP server: expose PromptKit as an MCP tool so Claude Code can call it
