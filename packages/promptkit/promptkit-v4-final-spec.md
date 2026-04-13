# PromptKit v4 — Final Spec
## Right-click to enhance · Chrome Extension + Raycast + React Hub
## Claude Code Build Document

---

## READ BEFORE WRITING ANY CODE

1. Read `/mnt/skills/public/frontend-design/SKILL.md` — governs all UI decisions.
2. Read all skill files present in `src/skills/` — these are the optimizer's rulebook. List the top 3 rules for each provider before writing any optimizer code.
3. Run `ls -la` in project root. Never overwrite existing files without confirming.
4. Check `.env.example` exists and contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before wiring any Supabase calls.
5. After reading skills, write a one-paragraph summary of how Claude and Gemini optimization should differ. This is your understanding check — get it right before touching optimizer code.

---

## ARCHITECTURE

### The problem with every prior approach
A standalone app adds a tab switch + copy-paste loop. An injected button adds visual noise to interfaces you use constantly. Both require you to remember to use them.

**Right-click is the correct primary trigger.** It's:
- The universal "I want to do something with this text" gesture
- Already learned behavior — no new habit to form
- Zero UI injected into chat interfaces (nothing to break when Claude.ai updates their DOM)
- Works on selected text *anywhere* — not just AI chat sites
- Feels like a native OS/browser feature, not a third-party tool

### What we're building (phased)

**Phase 1 — Chrome Extension**
Right-click context menu on selected text → submenu with provider/model/tone options → enhances in-place. Auto-detects which AI you're on. No injected buttons, no visual clutter.

**Phase 2 — React App (hub)**
Settings, full history browser (Supabase), builder mode for complex prompts, skill file viewer. Opened occasionally, not constantly.

**Phase 3 — Raycast Extension**
For power users and non-browser contexts. `Cmd+Space → "enhance"` → paste prompt → pick target → copy result. Works everywhere.

**Phase 4 — Polish**
Injected toolbar button (optional, off by default), keyboard shortcut, Firefox port.

### Shared skill files — the brain of everything

```
src/skills/
  claude.md      ← Claude optimization rules (edit to update optimizer)
  gemini.md      ← Gemini optimization rules
  openai.md      ← OpenAI optimization rules
  index.ts       ← exports all as Record<LLMProvider, string>
```

Skills are `.md` files loaded via Vite `?raw` imports — bundled at build time. **Updating a skill file and rebuilding updates all surfaces simultaneously.** No code changes required for rule updates. This is the entire point of the skill file architecture.

The React app has a Skills viewer tab showing current rule content and linking to the source files on GitHub for editing.

---

## PROJECT STRUCTURE

```
promptkit/
├── src/
│   ├── skills/                      ← SHARED — the optimizer's brain
│   │   ├── claude.md
│   │   ├── gemini.md
│   │   ├── openai.md
│   │   └── index.ts
│   │
│   ├── lib/                         ← SHARED — pure TS, no browser deps
│   │   ├── types.ts
│   │   ├── models.ts
│   │   ├── optimizers/
│   │   │   ├── claude.ts
│   │   │   ├── gemini.ts
│   │   │   ├── openai.ts
│   │   │   └── index.ts
│   │   └── utils.ts
│   │
│   ├── extension/                   ← CHROME EXTENSION
│   │   ├── manifest.json
│   │   ├── background.ts            ← context menu registration + message routing
│   │   ├── content/
│   │   │   ├── index.ts             ← content script entry
│   │   │   ├── detector.ts          ← detects provider + model from page context
│   │   │   ├── rewriter.ts          ← reads/writes selected text in textarea
│   │   │   ├── toast.ts             ← lightweight toast notification
│   │   │   └── sites/
│   │   │       ├── claude.ts        ← Claude.ai selectors
│   │   │       ├── gemini.ts        ← Gemini selectors
│   │   │       └── openai.ts        ← ChatGPT selectors
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   └── popup.ts             ← vanilla TS, not React (keeps popup tiny)
│   │   └── storage.ts               ← chrome.storage adapter
│   │
│   ├── app/                         ← REACT HUB APP
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   ├── quick/
│   │   │   │   ├── LLMSelector.tsx
│   │   │   │   ├── ModelPicker.tsx
│   │   │   │   ├── RepoInput.tsx
│   │   │   │   ├── PromptInput.tsx
│   │   │   │   └── OptimizedOutput.tsx
│   │   │   ├── builder/
│   │   │   │   ├── GoalContext.tsx
│   │   │   │   ├── SectionEditor.tsx
│   │   │   │   ├── TemplateSelector.tsx
│   │   │   │   └── ConstraintsPanel.tsx
│   │   │   ├── history/
│   │   │   │   ├── HistoryDrawer.tsx
│   │   │   │   └── HistoryCard.tsx
│   │   │   ├── skills/
│   │   │   │   └── SkillsViewer.tsx  ← read-only view of skill file contents
│   │   │   └── shared/
│   │   │       ├── CopyButton.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Toggle.tsx
│   │   │       └── Spinner.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePromptHistory.ts
│   │   │   ├── useOptimizer.ts
│   │   │   └── useRepoContext.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── database.types.ts
│   │   │   └── storage.ts           ← Supabase ops + localStorage prefs
│   │   └── pages/
│   │       ├── AppPage.tsx
│   │       ├── LoginPage.tsx
│   │       └── SignupPage.tsx
│   │
│   └── raycast/                     ← RAYCAST EXTENSION (Phase 3)
│       ├── package.json
│       └── src/
│           ├── enhance-prompt.tsx   ← main command
│           └── history.tsx          ← recent prompts command
│
├── vite.config.ts                   ← builds React app
├── vite.extension.config.ts         ← builds Chrome extension
└── package.json
```

---

## TYPES — `src/lib/types.ts`

```typescript
export type LLMProvider = 'claude' | 'gemini' | 'openai';

export type ClaudeModel =
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5';

export type GeminiModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash';

export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o3'
  | 'o4-mini';

export type ModelId = ClaudeModel | GeminiModel | OpenAIModel | string;
export type OutputMode = 'single' | 'phased';
export type PromptTone = 'direct' | 'thorough' | 'collaborative' | 'aggressive';
export type AppMode = 'quick' | 'builder';

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
  prompt: string | string[];   // string[] = phased
  phaseLabels?: string[];
  mode: OutputMode;
  notes: string[];             // human-readable list of changes made
}

// Extension-specific
export interface DetectedContext {
  provider: LLMProvider;
  model: ModelId;
  modelLabel: string;
  siteName: string;
  confidence: 'high' | 'low';  // low = fell back to provider default
}

export interface ExtensionPrefs {
  tone: PromptTone;
  outputMode: OutputMode;
  defaultModels: Record<LLMProvider, ModelId>;
  historyEnabled: boolean;
  showInjectedButton: boolean;  // Phase 4 — off by default
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
  theme: 'light' | 'dark' | 'system';
}
```

---

## MODEL REGISTRY — `src/lib/models.ts`

```typescript
export interface ModelMeta {
  id: ModelId;
  label: string;
  contextWindow: string;
  strengths: string[];
  bestFor: string[];
  supportsTools: boolean;
  supportsVision: boolean;
  tier: 'flagship' | 'balanced' | 'fast';
  badge?: string;
  isReasoningModel?: boolean;  // true for o3, o4 — changes optimizer behavior
}

export const MODELS: Record<LLMProvider, ModelMeta[]> = {
  claude: [
    {
      id: 'claude-opus-4-5',
      label: 'Claude Opus 4.5',
      contextWindow: '200K',
      strengths: ['complex reasoning', 'nuanced instruction following', 'long-horizon tasks'],
      bestFor: ['deep research', 'complex codebases', 'multi-step planning'],
      supportsTools: true, supportsVision: true,
      tier: 'flagship', badge: 'Most powerful',
    },
    {
      id: 'claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5',
      contextWindow: '200K',
      strengths: ['speed + intelligence balance', 'agentic coding', 'tool use'],
      bestFor: ['everyday coding', 'Claude Code sessions', 'production workloads'],
      supportsTools: true, supportsVision: true,
      tier: 'balanced', badge: 'Recommended',
    },
    {
      id: 'claude-haiku-4-5',
      label: 'Claude Haiku 4.5',
      contextWindow: '200K',
      strengths: ['speed', 'cost efficiency'],
      bestFor: ['quick queries', 'high-volume', 'simple tasks'],
      supportsTools: true, supportsVision: false,
      tier: 'fast', badge: 'Fastest',
    },
  ],
  gemini: [
    {
      id: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      contextWindow: '1M',
      strengths: ['massive context', 'multimodal', 'deep reasoning'],
      bestFor: ['huge codebases', 'video/image analysis', 'complex reasoning'],
      supportsTools: true, supportsVision: true,
      tier: 'flagship', badge: '1M context',
    },
    {
      id: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      contextWindow: '1M',
      strengths: ['fast', 'cost efficient', 'thinking mode'],
      bestFor: ['rapid iteration', 'everyday tasks'],
      supportsTools: true, supportsVision: true,
      tier: 'balanced', badge: 'Recommended',
    },
    {
      id: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      contextWindow: '1M',
      strengths: ['speed', 'reliability'],
      bestFor: ['fast responses', 'simple tasks'],
      supportsTools: true, supportsVision: true,
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
      supportsTools: true, supportsVision: true,
      tier: 'flagship', badge: 'Most versatile',
    },
    {
      id: 'o3',
      label: 'o3',
      contextWindow: '200K',
      strengths: ['deep reasoning', 'math', 'science'],
      bestFor: ['complex reasoning', 'math', 'research'],
      supportsTools: true, supportsVision: true,
      tier: 'flagship', badge: 'Best reasoning',
      isReasoningModel: true,
    },
    {
      id: 'o4-mini',
      label: 'o4 mini',
      contextWindow: '200K',
      strengths: ['fast reasoning', 'cost-efficient'],
      bestFor: ['everyday reasoning', 'coding'],
      supportsTools: true, supportsVision: true,
      tier: 'balanced', badge: 'Fast + smart',
      isReasoningModel: true,
    },
    {
      id: 'gpt-4o-mini',
      label: 'GPT-4o mini',
      contextWindow: '128K',
      strengths: ['speed', 'cost'],
      bestFor: ['quick tasks', 'high volume'],
      supportsTools: true, supportsVision: true,
      tier: 'fast', badge: 'Cheapest',
    },
  ],
};

export const LLM_META: Record<LLMProvider, {
  label: string;
  accentColor: string;
  accentClass: string;
  icon: string;
  company: string;
  openUrl: string;
  defaultModel: ModelId;
}> = {
  claude: {
    label: 'Claude', accentColor: '#D97706', accentClass: 'amber',
    icon: '◆', company: 'Anthropic', openUrl: 'https://claude.ai',
    defaultModel: 'claude-sonnet-4-5',
  },
  gemini: {
    label: 'Gemini', accentColor: '#3B82F6', accentClass: 'blue',
    icon: '✦', company: 'Google', openUrl: 'https://gemini.google.com',
    defaultModel: 'gemini-2.5-flash',
  },
  openai: {
    label: 'ChatGPT', accentColor: '#10B981', accentClass: 'emerald',
    icon: '◉', company: 'OpenAI', openUrl: 'https://chatgpt.com',
    defaultModel: 'gpt-4o',
  },
};

export function getDefaultModel(provider: LLMProvider): ModelId {
  return LLM_META[provider].defaultModel;
}

export function getModelMeta(provider: LLMProvider, modelId: ModelId): ModelMeta | undefined {
  return MODELS[provider].find(m => m.id === modelId);
}
```

---

## SKILL FILES — `src/skills/`

These are the optimizer's rulebook. Write them as substantive reference docs. The optimizer functions reference these strings when building transformation logic.

### `src/skills/index.ts`

```typescript
import claude from './claude.md?raw';
import gemini from './gemini.md?raw';
import openai from './openai.md?raw';
import type { LLMProvider } from '../lib/types';

export const SKILLS: Record<LLMProvider, string> = { claude, gemini, openai };
export const getSkill = (provider: LLMProvider): string => SKILLS[provider] ?? '';

// Metadata for the Skills viewer UI
export const SKILL_META: Record<LLMProvider, { filename: string; title: string }> = {
  claude: { filename: 'claude.md', title: 'Claude Optimization Rules' },
  gemini: { filename: 'gemini.md', title: 'Gemini Optimization Rules' },
  openai: { filename: 'openai.md', title: 'OpenAI / GPT Optimization Rules' },
};
```

### `src/skills/claude.md` — write this file in full

Structure:
```markdown
# Claude Prompt Optimization Rules

## Core principles (10 rules)
1. Role + task in sentence one — format and examples
2. XML tags for multi-component prompts — when/how
3. Positive framing — rewrite negative instructions
4. Explicit output spec — format, length, structure
5. Chain-of-thought trigger — when to add, exact phrasing
6. Context before instructions — <context> block pattern
7. Examples dramatically help — <example> block pattern
8. Specificity over vagueness — rewrite examples
9. Claude Code preamble — exact text to prepend
10. Separate background from task

## Model-specific adjustments
### Claude Haiku 4.5 — short, no XML, imperative
### Claude Sonnet 4.5 — balanced, XML for multi-part, agentic task patterns
### Claude Opus 4.5 — full XML, depth encouraged, reasoning guidance

## Claude Code mode
[Exact preamble text to prepend for Claude Code sessions]
[Repo context injection pattern]

## XML tag reference
[When to use each tag: <context>, <instructions>, <constraints>, <examples>, <output_format>]
[Full before/after example prompt]

## Anti-patterns
[10 specific before → after rewrites]
```

### `src/skills/gemini.md` — write this file in full

Structure:
```markdown
# Gemini Prompt Optimization Rules

## Core principles (10 rules)
1. Task-first imperative openers — not role-setting
2. Markdown structure over XML — ## headers, numbered lists
3. Explicit context window invocation — exact phrasing
4. Thinking mode triggers — when to add, Flash vs Pro difference
5. Grounding instruction — exact phrasing for factual tasks
6. Structured JSON output — schema specification pattern
7. Negative examples — Gemini benefits more than Claude
8. Reasoning depth calibration — Flash vs Pro
9. Multimodal specificity — image/video focus instructions
10. No over-scaffolding for simple tasks

## Model-specific adjustments
### Gemini 2.0 Flash — fast, direct, no thinking trigger
### Gemini 2.5 Flash — fast, add thinking trigger for complex tasks
### Gemini 2.5 Pro — full depth, leverage 1M context, explicit multi-step

## Prompt structure template
[Standard Gemini prompt pattern with Markdown headers]

## Anti-patterns
[10 specific before → after rewrites, including "don't use XML"]
```

### `src/skills/openai.md` — write this file in full

Structure:
```markdown
# OpenAI / GPT Prompt Optimization Rules

## Core principles (10 rules)
1. System vs user message framing
2. Reasoning models (o3/o4) — concise problem statement, NO chain-of-thought
3. GPT-4o — role statement, few-shot examples, explicit format
4. Format specification is mandatory — GPT will prose-ify without it
5. Few-shot examples for GPT-4o — pattern matching works extremely well
6. Explicit exclusions — "no preamble", "no explanation", "no code fences"
7. Length calibration — GPT defaults verbose
8. Tool use prompting patterns
9. o-series: all constraints upfront, trust the model to reason
10. Temperature guidance embedded in prompt text

## Model-specific adjustments
### GPT-4o — versatile, benefits from examples, needs length + format constraints
### o3 — short precise problem statement, no CoT instructions, all constraints inline
### o4-mini — same as o3, slightly more concise
### GPT-4o mini — very explicit required, short prompts only

## Prompt structure templates
[GPT-4o template]
[o3/o4-mini template — notably different]

## Anti-patterns
[10 specific before → after rewrites]
```

---

## OPTIMIZER ENGINE — `src/lib/optimizers/`

Pure TypeScript. No API calls. Rule-based transformations using skill file content as reference. Returns `OptimizationResult` with transformed prompt + human-readable `notes[]` explaining each change.

### Core transformation logic each optimizer must implement:

**`src/lib/optimizers/claude.ts`**

```typescript
export function optimizeForClaude(
  raw: string,
  modelId: ClaudeModel | string,
  repo: RepoContext | undefined,
  tone: PromptTone,
  outputMode: OutputMode
): OptimizationResult {
  const notes: string[] = [];
  let prompt = raw.trim();
  const model = getModelMeta('claude', modelId);

  // 1. Role injection
  // Check if first sentence already establishes a role ("You are...")
  // If not: infer role from task content and prepend
  // Note: "Added role statement: You are a [inferred role]."

  // 2. XML structure (skip for Haiku)
  // If prompt has multiple components (context + task, or task + constraints)
  // AND model tier is not 'fast': wrap in XML tags
  // Note: "Wrapped in XML structure for Claude's tag-based parsing."

  // 3. Positive reframing
  // Scan for: "don't", "never", "avoid", "do not"
  // Rewrite each as its positive equivalent
  // Note: "Reframed N negative instructions as positive directives."

  // 4. Output spec
  // Check if last sentence specifies format/length
  // If not: infer from task type and append explicit output spec
  // Note: "Added explicit output format specification."

  // 5. Chain-of-thought (Opus and Sonnet for complex tasks only)
  // If task is analytical/multi-step AND model tier is not 'fast':
  //   Add "Think through this step by step before responding."
  // Note: "Added chain-of-thought trigger for complex task."

  // 6. Repo context
  // If repo provided: inject as <context> block before instructions
  // If repo.isClaudeCode: prepend Claude Code preamble block
  // Note: "Injected repository context." / "Added Claude Code preamble."

  // 7. Tone application
  // direct: strip pleasantries, remove "please", "could you", "I was hoping"
  // thorough: add "Explain your reasoning at each step."
  // collaborative: add "Stop and ask if you reach a decision point."
  // aggressive: add "Challenge my approach if you see a better path."
  // Note: "Applied [tone] tone framing."

  // 8. Model-tier adjustment
  // Haiku: remove XML, strip to essentials, use imperative sentences
  // Sonnet: balanced, keep XML if added
  // Opus: add "Consider the tradeoffs between approaches before deciding."

  // 9. Phased output
  // If outputMode === 'phased': split into 3 logical phases
  // Phase 1: orientation/read, Phase 2: execution, Phase 3: finalize
  // Each phase is self-contained

  return { prompt: outputMode === 'phased' ? buildPhases(prompt) : prompt, mode: outputMode, notes };
}
```

**`src/lib/optimizers/gemini.ts`**

```typescript
// Key differences from Claude optimizer:
// 1. Strip/convert XML → Markdown headers
// 2. Remove role-setting preamble, convert to imperative opener
// 3. Add context window invocation for Pro + long prompts
// 4. Add thinking trigger for Pro + complex tasks (NOT Flash)
// 5. Add grounding instruction for factual prompts
// 6. Inject repo context as Markdown section (not XML)
// 7. Use --- dividers for phased output (not XML phase blocks)
```

**`src/lib/optimizers/openai.ts`**

```typescript
// Key differences:
// 1. Detect if o-series (isReasoningModel: true):
//    - Strip all chain-of-thought language
//    - Remove role-setting
//    - Make concise — move all constraints inline with problem statement
// 2. For GPT-4o/mini:
//    - Keep role statement
//    - Add format spec (stricter than Claude — GPT needs "No explanation." explicitly)
//    - Add length constraint
//    - Suggest few-shot example slot if task is pattern-like
// 3. Convert XML → Markdown
// 4. Add "No preamble." "No explanation." for code/JSON outputs
```

**`src/lib/optimizers/index.ts`**

```typescript
import { SKILLS } from '../skills';

export function optimizePrompt(config: PromptConfig): OptimizationResult {
  const raw = buildRawFromConfig(config);
  const { provider, model } = config.target;
  const tone = config.tone ?? 'direct';
  const outputMode = config.outputMode ?? 'single';
  const repo = config.repo;

  switch (provider) {
    case 'claude':
      return optimizeForClaude(raw, model, repo, tone, outputMode);
    case 'gemini':
      return optimizeForGemini(raw, model, repo, tone, outputMode);
    case 'openai':
      return optimizeForOpenAI(raw, model, repo, tone, outputMode);
    default:
      return { prompt: raw, mode: outputMode, notes: [] };
  }
}

function buildRawFromConfig(config: PromptConfig): string {
  if (config.mode === 'quick') return config.rawPrompt ?? '';
  // Builder mode: assemble from structured fields
  const parts: string[] = [];
  if (config.goal) parts.push(`Goal: ${config.goal}`);
  if (config.subject) parts.push(`Subject: ${config.subject}`);
  config.sections
    ?.sort((a, b) => a.order - b.order)
    .forEach(s => { if (s.title || s.body) parts.push(`${s.title}\n${s.body}`); });
  if (config.constraints) parts.push(`Constraints: ${config.constraints}`);
  if (config.deliverable) parts.push(`Deliverable: ${config.deliverable}`);
  return parts.join('\n\n');
}
```

---

## PHASE 1 — CHROME EXTENSION

### The right-click flow

```
User selects text in any textarea (on Claude.ai, Gemini, ChatGPT, or anywhere)
→ Right-clicks
→ Sees: "PromptKit" submenu
  → "Enhance for Claude (Sonnet 4.5)"     ← auto-detected from current site
  → "Enhance for Gemini (Flash)"
  → "Enhance for ChatGPT (GPT-4o)"
  → ─────────────────────────────
  → "Enhance with options..."              ← opens mini panel for tone/model control
  → "Open PromptKit"                       ← opens React app in new tab
```

When "Enhance for [detected]" is clicked:
1. Background script receives the context menu click
2. Sends message to content script: `{ action: 'enhance', provider, model, selectedText }`
3. Content script runs optimizer locally
4. Replaces selected text in textarea with optimized version
5. Shows toast: "Enhanced for Sonnet 4.5 · 4 changes"

**Key insight:** The right-click submenu shows the auto-detected option first (highest priority), then all three providers. User rarely needs to think — just click the top option.

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "PromptKit",
  "version": "1.0.0",
  "description": "Right-click any prompt to enhance it for Claude, Gemini, or ChatGPT.",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "scripting"
  ],
  "host_permissions": [
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://chatgpt.com/*",
    "https://aistudio.google.com/*",
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "commands": {
    "enhance-with-detected": {
      "suggested_key": { "default": "Ctrl+Shift+E", "mac": "Command+Shift+E" },
      "description": "Enhance current prompt for detected AI"
    }
  }
}
```

Note: `<all_urls>` in host_permissions enables right-click enhancement on any site — not just AI chat interfaces. This is the correct scope for a right-click tool.

### `src/extension/background.ts`

The background service worker owns the context menu and orchestrates all message passing.

```typescript
import { SKILLS } from '../skills/index';
import { optimizePrompt } from '../lib/optimizers/index';
import { getStoredPrefs, saveToExtensionHistory } from './storage';
import type { LLMProvider, ModelId, PromptTone } from '../lib/types';

// Context menu IDs
const MENU = {
  ROOT: 'promptkit-root',
  ENHANCE_DETECTED: 'promptkit-enhance-detected',
  ENHANCE_CLAUDE: 'promptkit-enhance-claude',
  ENHANCE_GEMINI: 'promptkit-enhance-gemini',
  ENHANCE_OPENAI: 'promptkit-enhance-openai',
  SEPARATOR: 'promptkit-separator',
  WITH_OPTIONS: 'promptkit-with-options',
  OPEN_APP: 'promptkit-open-app',
};

chrome.runtime.onInstalled.addListener(() => {
  buildContextMenu();
});

async function buildContextMenu() {
  await chrome.contextMenus.removeAll();

  // Root — only shows when text is selected
  chrome.contextMenus.create({
    id: MENU.ROOT,
    title: 'PromptKit',
    contexts: ['selection'],
  });

  // Will be dynamically updated by content script detection
  chrome.contextMenus.create({
    id: MENU.ENHANCE_DETECTED,
    parentId: MENU.ROOT,
    title: 'Enhance for detected AI',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'promptkit-sep1',
    parentId: MENU.ROOT,
    type: 'separator',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU.ENHANCE_CLAUDE,
    parentId: MENU.ROOT,
    title: '◆ Claude (Sonnet 4.5)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU.ENHANCE_GEMINI,
    parentId: MENU.ROOT,
    title: '✦ Gemini (Flash)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU.ENHANCE_OPENAI,
    parentId: MENU.ROOT,
    title: '◉ ChatGPT (GPT-4o)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'promptkit-sep2',
    parentId: MENU.ROOT,
    type: 'separator',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU.WITH_OPTIONS,
    parentId: MENU.ROOT,
    title: 'Enhance with options...',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU.OPEN_APP,
    parentId: MENU.ROOT,
    title: 'Open PromptKit →',
    contexts: ['selection'],
  });
}

// Update "detected" menu item label based on current tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  updateDetectedMenuItem(tab.url ?? '');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateDetectedMenuItem(tab.url ?? '');
  }
});

function updateDetectedMenuItem(url: string) {
  let label = 'Enhance for detected AI';
  if (url.includes('claude.ai')) label = '◆ Enhance for Claude (auto-detected)';
  else if (url.includes('gemini.google.com')) label = '✦ Enhance for Gemini (auto-detected)';
  else if (url.includes('chatgpt.com')) label = '◉ Enhance for ChatGPT (auto-detected)';

  chrome.contextMenus.update(MENU.ENHANCE_DETECTED, { title: label });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  const prefs = await getStoredPrefs();
  const url = tab.url ?? '';

  if (info.menuItemId === MENU.OPEN_APP) {
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
    return;
  }

  if (info.menuItemId === MENU.WITH_OPTIONS) {
    // Tell content script to open mini options panel, then enhance
    chrome.tabs.sendMessage(tab.id, { action: 'open-options-panel', selectedText: info.selectionText });
    return;
  }

  // Determine target provider/model
  let provider: LLMProvider;
  let model: ModelId;

  switch (info.menuItemId) {
    case MENU.ENHANCE_DETECTED:
      provider = detectProviderFromUrl(url);
      model = await detectModelFromTab(tab.id, provider, prefs);
      break;
    case MENU.ENHANCE_CLAUDE:
      provider = 'claude'; model = prefs.defaultModels.claude;
      break;
    case MENU.ENHANCE_GEMINI:
      provider = 'gemini'; model = prefs.defaultModels.gemini;
      break;
    case MENU.ENHANCE_OPENAI:
      provider = 'openai'; model = prefs.defaultModels.openai;
      break;
    default:
      return;
  }

  // Run optimizer in background (has access to skill files via bundle)
  const result = optimizePrompt({
    mode: 'quick',
    target: { provider, model },
    rawPrompt: info.selectionText,
    tone: prefs.tone,
    outputMode: prefs.outputMode,
  });

  const optimized = Array.isArray(result.prompt) ? result.prompt.join('\n\n---\n\n') : result.prompt;

  // Send result to content script to replace selection
  chrome.tabs.sendMessage(tab.id, {
    action: 'replace-selection',
    optimizedText: optimized,
    notes: result.notes,
    provider,
    model,
  });

  // Save to history
  if (prefs.historyEnabled) {
    await saveToExtensionHistory({
      provider, modelId: model, modelLabel: model,
      rawPrompt: info.selectionText,
      optimizedPrompt: optimized,
      notes: result.notes,
      tone: prefs.tone,
      siteName: getSiteName(url),
    });
  }
});

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'enhance-with-detected') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  // Tell content script to get current selection and enhance
  chrome.tabs.sendMessage(tab.id, { action: 'enhance-keyboard-shortcut', url: tab.url });
});

function detectProviderFromUrl(url: string): LLMProvider {
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('gemini.google.com') || url.includes('aistudio.google.com')) return 'gemini';
  if (url.includes('chatgpt.com')) return 'openai';
  return 'claude'; // fallback
}

async function detectModelFromTab(tabId: number, provider: LLMProvider, prefs: ExtensionPrefs): Promise<ModelId> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'detect-model' });
    return response?.model ?? prefs.defaultModels[provider];
  } catch {
    return prefs.defaultModels[provider];
  }
}

function getSiteName(url: string): string {
  if (url.includes('claude.ai')) return 'Claude.ai';
  if (url.includes('gemini.google.com')) return 'Gemini';
  if (url.includes('chatgpt.com')) return 'ChatGPT';
  return new URL(url).hostname;
}
```

### `src/extension/content/index.ts`

Content script: handles model detection + text replacement + toast. Runs on all pages.

```typescript
import { detectModel } from './detector';
import { replaceSelectedText, getCurrentSelection } from './rewriter';
import { showToast } from './toast';
import { openOptionsPanel } from './panel';
import { optimizePrompt } from '../../lib/optimizers/index';
import { getStoredPrefs } from '../storage';

// Message handler from background
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.action) {

    case 'detect-model':
      // Background needs to know which model is selected on this page
      const detected = detectModel();
      sendResponse(detected);
      break;

    case 'replace-selection':
      // Background ran the optimizer, now replace the selected text
      replaceSelectedText(msg.optimizedText);
      showToast(`Enhanced for ${msg.model} · ${msg.notes.length} changes`);
      sendResponse({ ok: true });
      break;

    case 'open-options-panel':
      // Show mini panel before enhancing
      openOptionsPanel(msg.selectedText);
      sendResponse({ ok: true });
      break;

    case 'enhance-keyboard-shortcut':
      // Keyboard shortcut was pressed — get current selection and enhance
      const selection = getCurrentSelection();
      if (selection) {
        const prefs = getStoredPrefs(); // sync version for content scripts
        const provider = detectProviderFromUrl(msg.url ?? window.location.href);
        const model = detectModel()?.model ?? prefs.defaultModels[provider];
        const result = optimizePrompt({
          mode: 'quick',
          target: { provider, model },
          rawPrompt: selection,
          tone: prefs.tone,
          outputMode: prefs.outputMode,
        });
        const optimized = Array.isArray(result.prompt)
          ? result.prompt.join('\n\n---\n\n')
          : result.prompt;
        replaceSelectedText(optimized);
        showToast(`Enhanced for ${model} · ${result.notes.length} changes`);
      }
      sendResponse({ ok: true });
      break;
  }
  return true; // keep message channel open for async
});
```

### `src/extension/content/detector.ts`

Detects which AI the user is on and which model is selected.

```typescript
import type { DetectedContext, LLMProvider, ModelId } from '../../lib/types';
import { claudeAdapter } from './sites/claude';
import { geminiAdapter } from './sites/gemini';
import { openaiAdapter } from './sites/openai';

export interface SiteAdapter {
  provider: LLMProvider;
  matches: (url: string) => boolean;
  detectModelLabel: () => string | null;
  parseModelId: (label: string) => ModelId;
  defaultModel: ModelId;
}

const ADAPTERS: SiteAdapter[] = [claudeAdapter, geminiAdapter, openaiAdapter];

export function detectModel(): DetectedContext | null {
  const url = window.location.href;
  const adapter = ADAPTERS.find(a => a.matches(url));
  if (!adapter) return null;

  const label = adapter.detectModelLabel();
  const model = label ? adapter.parseModelId(label) : adapter.defaultModel;

  return {
    provider: adapter.provider,
    model,
    modelLabel: label ?? `${adapter.provider} (default)`,
    siteName: getSiteName(url),
    confidence: label ? 'high' : 'low',
  };
}

function getSiteName(url: string): string {
  if (url.includes('claude.ai')) return 'Claude.ai';
  if (url.includes('gemini.google.com')) return 'Gemini';
  if (url.includes('chatgpt.com')) return 'ChatGPT';
  return window.location.hostname;
}
```

### `src/extension/content/sites/claude.ts`

```typescript
export const claudeAdapter: SiteAdapter = {
  provider: 'claude',
  matches: (url) => url.includes('claude.ai'),
  defaultModel: 'claude-sonnet-4-5',

  detectModelLabel: () => {
    // Try multiple selectors — Claude.ai updates their DOM regularly
    // Log which selector succeeds for debugging
    const selectors = [
      '[data-testid="model-selector-dropdown"] span',
      'button[aria-label*="model"] span',
      '[class*="model-selector"] span',
      'button[class*="ModelSelector"] span',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        console.debug(`[PromptKit] Claude model detected via: ${sel}`);
        return el.textContent.trim();
      }
    }
    console.debug('[PromptKit] Claude model detection failed, using default');
    return null;
  },

  parseModelId: (label: string): ClaudeModel => {
    const l = label.toLowerCase();
    if (l.includes('opus')) return 'claude-opus-4-5';
    if (l.includes('haiku')) return 'claude-haiku-4-5';
    return 'claude-sonnet-4-5';
  },
};
```

### `src/extension/content/sites/gemini.ts`

```typescript
export const geminiAdapter: SiteAdapter = {
  provider: 'gemini',
  matches: (url) => url.includes('gemini.google.com') || url.includes('aistudio.google.com'),
  defaultModel: 'gemini-2.5-flash',

  detectModelLabel: () => {
    const selectors = [
      'mat-select[aria-label*="model"] .mat-select-value-text',
      '[data-model-id]',
      '[class*="model-selector"] span',
      'ms-model-selector span',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        console.debug(`[PromptKit] Gemini model detected via: ${sel}`);
        return el.textContent.trim();
      }
    }
    return null;
  },

  parseModelId: (label: string): GeminiModel => {
    const l = label.toLowerCase();
    if (l.includes('pro')) return 'gemini-2.5-pro';
    if (l.includes('2.0')) return 'gemini-2.0-flash';
    return 'gemini-2.5-flash';
  },
};
```

### `src/extension/content/sites/openai.ts`

```typescript
export const openaiAdapter: SiteAdapter = {
  provider: 'openai',
  matches: (url) => url.includes('chatgpt.com'),
  defaultModel: 'gpt-4o',

  detectModelLabel: () => {
    const selectors = [
      '[data-testid="model-switcher-dropdown-button"] span',
      'button[id*="model"] span',
      '[class*="model-switcher"] span',
      '[aria-label*="Model"] span',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        console.debug(`[PromptKit] OpenAI model detected via: ${sel}`);
        return el.textContent.trim();
      }
    }
    return null;
  },

  parseModelId: (label: string): OpenAIModel => {
    const l = label.toLowerCase();
    if (l.includes('o3')) return 'o3';
    if (l.includes('o4')) return 'o4-mini';
    if (l.includes('mini')) return 'gpt-4o-mini';
    return 'gpt-4o';
  },
};
```

### `src/extension/content/rewriter.ts`

The most technically delicate part. Must work with React-controlled contenteditable divs.

```typescript
export function getCurrentSelection(): string | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;
  return sel.toString().trim() || null;
}

export function replaceSelectedText(newText: string): boolean {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const editableEl = findEditableParent(container);

  if (!editableEl) return false;

  editableEl.focus();

  if (editableEl.getAttribute('contenteditable') === 'true') {
    return replaceInContentEditable(range, newText, editableEl);
  } else if (editableEl.tagName === 'TEXTAREA') {
    return replaceInTextarea(editableEl as HTMLTextAreaElement, newText);
  }

  return false;
}

function replaceInContentEditable(range: Range, newText: string, el: HTMLElement): boolean {
  try {
    // execCommand is the most compatible approach for React-controlled contenteditables
    // It triggers React's synthetic event system correctly
    range.deleteContents();
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);

    // Move cursor to end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    // Dispatch input event so React updates its state
    el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
    return true;
  } catch (e) {
    // Fallback: execCommand
    try {
      document.execCommand('insertText', false, newText);
      return true;
    } catch {
      return false;
    }
  }
}

function replaceInTextarea(el: HTMLTextAreaElement, newText: string): boolean {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const current = el.value;
  const next = current.slice(0, start) + newText + current.slice(end);

  // Bypass React's value setter via native prototype
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(el, next);
  } else {
    el.value = next;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.setSelectionRange(start + newText.length, start + newText.length);
  return true;
}

function findEditableParent(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement) {
      if (current.getAttribute('contenteditable') === 'true') return current;
      if (current.tagName === 'TEXTAREA') return current;
    }
    current = current.parentNode;
  }
  return null;
}
```

### `src/extension/content/toast.ts`

Lightweight toast — vanilla JS, no library. Injected into the host page.

```typescript
export function showToast(message: string, duration = 2800): void {
  // Remove existing toast
  document.getElementById('pk-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'pk-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: rgba(17, 17, 17, 0.92);
    color: #f5f5f5;
    padding: 9px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    letter-spacing: 0.01em;
    z-index: 2147483647;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
    opacity: 0;
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(4px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
```

### `src/extension/content/panel.ts` — "Enhance with options..."

Mini floating panel for when the user wants to control tone/model before enhancing. Appears near the right-click origin point (approximated using mouse position from last `contextmenu` event).

```typescript
let lastContextMenuPos = { x: 0, y: 0 };

// Track where context menu was triggered
document.addEventListener('contextmenu', (e) => {
  lastContextMenuPos = { x: e.clientX, y: e.clientY };
});

export function openOptionsPanel(selectedText: string): void {
  document.getElementById('pk-options-panel')?.remove();

  const prefs = getStoredPrefsSync();
  const detected = detectModel();

  const panel = document.createElement('div');
  panel.id = 'pk-options-panel';

  panel.innerHTML = `
    <div class="pk-panel-header">
      <span class="pk-dot pk-dot-${detected?.provider ?? 'claude'}"></span>
      <span class="pk-model-name">${detected?.modelLabel ?? 'Auto-detect'}</span>
      ${detected?.confidence === 'low' ? '<span class="pk-low-conf">fallback</span>' : ''}
    </div>

    <div class="pk-field">
      <label>Target</label>
      <div class="pk-pills" data-field="provider">
        ${(['claude', 'gemini', 'openai'] as LLMProvider[]).map(p => `
          <button class="pk-pill ${(detected?.provider ?? 'claude') === p ? 'active' : ''}"
            data-value="${p}">${p === 'openai' ? 'ChatGPT' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
        `).join('')}
      </div>
    </div>

    <div class="pk-field">
      <label>Tone</label>
      <div class="pk-pills" data-field="tone">
        ${(['direct', 'thorough', 'collaborative', 'aggressive'] as PromptTone[]).map(t => `
          <button class="pk-pill ${prefs.tone === t ? 'active' : ''}" data-value="${t}">
            ${t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="pk-field">
      <label>Output</label>
      <div class="pk-pills" data-field="outputMode">
        <button class="pk-pill ${prefs.outputMode === 'single' ? 'active' : ''}" data-value="single">Single</button>
        <button class="pk-pill ${prefs.outputMode === 'phased' ? 'active' : ''}" data-value="phased">Phased</button>
      </div>
    </div>

    <button class="pk-cta" id="pk-enhance-btn">Enhance ↑</button>
  `;

  // Position near cursor
  const { x, y } = lastContextMenuPos;
  const panelWidth = 280;
  const left = Math.min(x, window.innerWidth - panelWidth - 16);
  const top = Math.max(16, y - 240);

  panel.style.cssText = `
    position: fixed;
    top: ${top}px;
    left: ${left}px;
    width: ${panelWidth}px;
    z-index: 2147483647;
    background: white;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #111;
  `;

  // State tracking
  let currentProvider: LLMProvider = detected?.provider ?? 'claude';
  let currentTone: PromptTone = prefs.tone;
  let currentOutputMode: OutputMode = prefs.outputMode;

  // Pill toggles
  panel.querySelectorAll('.pk-pills').forEach(group => {
    group.querySelectorAll('.pk-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.pk-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const field = (group as HTMLElement).dataset.field;
        const value = (btn as HTMLElement).dataset.value;
        if (field === 'provider') currentProvider = value as LLMProvider;
        if (field === 'tone') currentTone = value as PromptTone;
        if (field === 'outputMode') currentOutputMode = value as OutputMode;
      });
    });
  });

  // Enhance button
  panel.querySelector('#pk-enhance-btn')?.addEventListener('click', () => {
    panel.remove();
    const model = prefs.defaultModels[currentProvider];
    const result = optimizePrompt({
      mode: 'quick',
      target: { provider: currentProvider, model },
      rawPrompt: selectedText,
      tone: currentTone,
      outputMode: currentOutputMode,
    });
    const optimized = Array.isArray(result.prompt)
      ? result.prompt.join('\n\n---\n\n')
      : result.prompt;
    replaceSelectedText(optimized);
    showToast(`Enhanced for ${model} · ${result.notes.length} changes`);
    savePrefsSync({ tone: currentTone, outputMode: currentOutputMode });
  });

  // Close on outside click
  const closeOnOutside = (e: MouseEvent) => {
    if (!panel.contains(e.target as Node)) {
      panel.remove();
      document.removeEventListener('click', closeOnOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', closeOnOutside), 100);

  document.body.appendChild(panel);
}
```

### `src/extension/storage.ts`

```typescript
import type { ExtensionPrefs, HistoryItem, LLMProvider, ModelId } from '../lib/types';

const DEFAULT_PREFS: ExtensionPrefs = {
  tone: 'direct',
  outputMode: 'single',
  defaultModels: {
    claude: 'claude-sonnet-4-5',
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o',
  },
  historyEnabled: true,
  showInjectedButton: false,  // Phase 4, off by default
};

// Async version for background script
export async function getStoredPrefs(): Promise<ExtensionPrefs> {
  const data = await chrome.storage.sync.get('prefs');
  return { ...DEFAULT_PREFS, ...(data.prefs ?? {}) };
}

export async function savePrefs(prefs: Partial<ExtensionPrefs>): Promise<void> {
  const current = await getStoredPrefs();
  await chrome.storage.sync.set({ prefs: { ...current, ...prefs } });
}

// Sync version for content scripts (reads from a local cache written by background)
// Background writes prefs to chrome.storage.local after every change for sync access
export function getStoredPrefsSync(): ExtensionPrefs {
  // Content scripts can't use async chrome.storage easily
  // Background script keeps a copy in a global variable it updates
  // and messages to content scripts on change
  // For simplicity v1: return defaults, async prefs load handled via messaging
  return DEFAULT_PREFS;
}

export function savePrefsSync(partial: Partial<ExtensionPrefs>): void {
  chrome.runtime.sendMessage({ action: 'save-prefs', prefs: partial });
}

// History — chrome.storage.local, max 50 items
export async function saveToExtensionHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
  const data = await chrome.storage.local.get('history');
  const history: HistoryItem[] = data.history ?? [];
  history.unshift({ ...item, id: crypto.randomUUID(), timestamp: Date.now() });
  await chrome.storage.local.set({ history: history.slice(0, 50) });
}

export async function getExtensionHistory(): Promise<HistoryItem[]> {
  const data = await chrome.storage.local.get('history');
  return data.history ?? [];
}

export async function clearExtensionHistory(): Promise<void> {
  await chrome.storage.local.set({ history: [] });
}
```

---

## PHASE 2 — REACT APP (HUB)

Refer to v2 spec for Supabase schema, auth, and full component list. Key additions/changes for v4:

### Skills viewer — `src/app/components/skills/SkillsViewer.tsx`

New settings tab showing live skill file content. This is how you know what rules are active.

```tsx
// Shows content of all three skill .md files
// Read-only code blocks with syntax highlighting (prism-react-renderer or similar)
// Shows: filename, rule count (parsed from ## headings), last build date
// "Edit on GitHub" link per file → links to src/skills/[file] in the repo
// "How skills work" explainer: "Update these files and rebuild to change optimization behavior"
```

### Extension prefs sync — `src/app/lib/extensionSync.ts`

```typescript
// If the Chrome extension is installed, settings changes in the React app
// propagate to the extension via chrome.storage.sync

export function isExtensionInstalled(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage;
}

export async function syncPrefsToExtension(prefs: UserPreferences): Promise<void> {
  if (!isExtensionInstalled()) return;
  await chrome.storage.sync.set({
    prefs: {
      tone: 'direct',
      outputMode: 'single',
      defaultModels: prefs.defaultModels,
      historyEnabled: true,
    }
  });
}

// Extension history + Supabase history merged in history drawer
export async function getExtensionHistoryFromApp(): Promise<HistoryItem[]> {
  if (!isExtensionInstalled()) return [];
  const data = await chrome.storage.local.get('history');
  return data.history ?? [];
}
```

---

## PHASE 3 — RAYCAST EXTENSION

Built separately as a Raycast extension package. Lives in `src/raycast/`.

```typescript
// src/raycast/src/enhance-prompt.tsx
import { Action, ActionPanel, Form, showHUD, Clipboard } from '@raycast/api';
import { optimizePrompt } from '../../lib/optimizers/index';
import type { LLMProvider, PromptTone } from '../../lib/types';

export default function EnhancePrompt() {
  async function handleSubmit(values: {
    provider: LLMProvider;
    model: string;
    tone: PromptTone;
    rawPrompt: string;
  }) {
    const result = optimizePrompt({
      mode: 'quick',
      target: { provider: values.provider, model: values.model },
      rawPrompt: values.rawPrompt,
      tone: values.tone,
      outputMode: 'single',
    });
    const optimized = Array.isArray(result.prompt) ? result.prompt[0] : result.prompt;
    await Clipboard.copy(optimized);
    await showHUD(`Enhanced for ${values.model} · copied to clipboard`);
  }

  return (
    <Form actions={<ActionPanel><Action.SubmitForm onSubmit={handleSubmit} /></ActionPanel>}>
      <Form.Dropdown id="provider" title="Target AI" defaultValue="claude">
        <Form.Dropdown.Item value="claude" title="◆ Claude" />
        <Form.Dropdown.Item value="gemini" title="✦ Gemini" />
        <Form.Dropdown.Item value="openai" title="◉ ChatGPT" />
      </Form.Dropdown>
      <Form.Dropdown id="model" title="Model" defaultValue="claude-sonnet-4-5">
        {/* Dynamic based on provider selection */}
      </Form.Dropdown>
      <Form.Dropdown id="tone" title="Tone" defaultValue="direct">
        <Form.Dropdown.Item value="direct" title="Direct" />
        <Form.Dropdown.Item value="thorough" title="Thorough" />
        <Form.Dropdown.Item value="collaborative" title="Collaborative" />
        <Form.Dropdown.Item value="aggressive" title="Aggressive" />
      </Form.Dropdown>
      <Form.TextArea id="rawPrompt" title="Prompt" placeholder="Paste your rough prompt here..." />
    </Form>
  );
}
```

Raycast extension uses the same `src/lib/optimizers/` and `src/skills/` — shared code, same optimization logic, no duplication.

---

## VITE BUILD CONFIG

### `vite.extension.config.ts`

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/extension',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/extension/background.ts'),
        content: resolve(__dirname, 'src/extension/content/index.ts'),
        popup: resolve(__dirname, 'src/extension/popup/popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',  // IIFE required for content scripts — NOT ES modules
        inlineDynamicImports: true,
      },
    },
    // Do not minify in development — readable output helps debugging selector issues
    minify: process.env.NODE_ENV === 'production',
  },
});
```

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:ext": "vite build --config vite.extension.config.ts --watch",
    "build": "npm run build:app && npm run build:ext",
    "build:app": "vite build",
    "build:ext": "vite build --config vite.extension.config.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## BUILD ORDER — strict sequence

**Phase 1a — Shared logic (no UI)**
1. Scaffold: Vite + TypeScript config + Tailwind
2. `src/lib/types.ts`
3. `src/lib/models.ts`
4. `src/skills/claude.md` — write full content (not stubs)
5. `src/skills/gemini.md` — write full content
6. `src/skills/openai.md` — write full content
7. `src/skills/index.ts` — verify `?raw` imports resolve
8. `src/lib/optimizers/claude.ts`
9. `src/lib/optimizers/gemini.ts`
10. `src/lib/optimizers/openai.ts`
11. `src/lib/optimizers/index.ts`
12. **Write optimizer unit tests.** Test: same rough prompt → Claude output contains XML + role, Gemini output contains Markdown headers + no XML, o3 output is shorter and contains no chain-of-thought. These tests protect against skill file edits breaking optimizer output shape.

**Phase 1b — Chrome extension**
13. `manifest.json`
14. `src/extension/storage.ts`
15. `src/extension/content/sites/claude.ts`
16. `src/extension/content/sites/gemini.ts`
17. `src/extension/content/sites/openai.ts`
18. `src/extension/content/detector.ts`
19. `src/extension/content/rewriter.ts`
20. `src/extension/content/toast.ts`
21. `src/extension/content/index.ts`
22. `src/extension/background.ts`
23. `vite.extension.config.ts`
24. Build extension: `npm run build:ext`
25. Load unpacked in Chrome (`chrome://extensions` → Developer mode → Load unpacked → `dist/extension`)
26. **Manual test gate:** Open Claude.ai, select text, right-click → PromptKit → Enhance for Claude. Verify text replaces correctly and toast appears. Repeat on Gemini and ChatGPT. Do not proceed until all three work.
27. `src/extension/content/panel.ts` — "Enhance with options..." panel
28. `src/extension/popup/popup.ts` + `popup.html`
29. Test keyboard shortcut `Cmd+Shift+E`

**Phase 2 — React app**
30. Supabase migrations (prompts + user_preferences tables)
31. `src/app/lib/supabase.ts` + `database.types.ts`
32. `src/app/lib/storage.ts`
33. Auth hooks + login/signup pages + AuthGuard
34. Verify auth flow end to end before any other UI
35. Shared UI components (CopyButton, Badge, Toggle, Spinner)
36. Header
37. LLMSelector + ModelPicker
38. RepoInput + useRepoContext hook
39. PromptInput + useOptimizer hook
40. OptimizedOutput
41. AppPage — wire quick mode
42. HistoryDrawer + usePromptHistory hook
43. Builder mode components
44. SkillsViewer + extensionSync
45. Settings drawer
46. Mobile responsive pass
47. Dark mode

**Phase 3 — Raycast**
48. `src/raycast/package.json` + Raycast API setup
49. `src/raycast/src/enhance-prompt.tsx`
50. `src/raycast/src/history.tsx`
51. Test in Raycast developer mode

---

## QUALITY BAR

### Extension (gate before Phase 2)
- [ ] Right-click on selected text in Claude.ai textarea → "PromptKit" submenu appears
- [ ] "Enhance for Claude (auto-detected)" shows correct detected model label
- [ ] Clicking enhances — optimized text replaces selection in-place
- [ ] Toast shows model name + change count
- [ ] Same test on Gemini.google.com
- [ ] Same test on ChatGPT.com
- [ ] Right-click on selected text on google.com (non-AI site) → submenu still appears, shows provider options, enhancing works
- [ ] "Enhance with options..." opens the mini panel near cursor
- [ ] Panel tone/output mode changes are applied to the enhancement
- [ ] `Cmd+Shift+E` triggers enhance for detected AI
- [ ] Extension history shows last 5 items in popup
- [ ] Claude output: XML structure present, role statement present
- [ ] Gemini output: Markdown headers, no XML, thinking trigger present for Pro
- [ ] OpenAI o3 output: concise, no chain-of-thought, shorter than Claude/Gemini versions
- [ ] Button re-injects if user navigates within Claude.ai SPA (new chat)

### React app
- [ ] All checks from v2 spec
- [ ] Skills viewer shows content of all 3 skill files
- [ ] "Edit on GitHub" links are correct
- [ ] Extension prefs sync updates extension when settings change in app
- [ ] Extension history items appear in history drawer alongside Supabase history

---

## IMPORTANT NOTES FOR CLAUDE CODE

### DOM selector fragility
The site adapters in `src/extension/content/sites/` will break when Claude.ai, Gemini, or ChatGPT update their UIs. Design them with:
1. Multiple selectors tried in order
2. `console.debug` logging which selector succeeded — visible in DevTools on the content script
3. Graceful fallback to provider default model when detection fails
4. The `confidence: 'low'` flag surfaces in the mini panel so the user knows it fell back

### React textarea replacement
The `replaceInContentEditable` function in `rewriter.ts` is the most fragile code in the project. Test it on all three sites in every PR. If `document.execCommand` is deprecated by Chrome, the fallback path using `InputEvent` dispatch must be ready.

### IIFE bundle requirement
Content scripts MUST be bundled as IIFE (`format: 'iife'` in rollup). They cannot use ES module syntax at runtime. The `vite.extension.config.ts` handles this — do not change the output format.

### Skill file updates don't require code changes
When updating `claude.md`, `gemini.md`, or `openai.md`:
1. Edit the file
2. Run `npm run build:ext`
3. Reload the extension in `chrome://extensions`
4. Run the unit tests to verify output shape is preserved

The optimizer unit tests are the regression suite for skill file changes.
