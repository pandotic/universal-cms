---
name: gemini-prompting
description: >
  Google Gemini prompting best practices and configuration reference for Flash 3.0,
  Pro 3.1, and Nano Banana 2 (image generation). Covers JSON mode, thinking levels,
  temperature, output length, prompt structure, image generation, and known gotchas.
triggers:
  - Gemini prompt
  - Gemini API call
  - Gemini fallback
  - Gemini configuration
  - Google AI API
  - Gemini 2.5 Flash
  - Gemini 3 Flash
  - Gemini 3.1 Pro
  - Gemini Pro
  - Nano Banana
  - Nano Banana 2
  - image generation
  - optimizing for Gemini
  - Gemini best practices
  - generativelanguage API
---

# Gemini Prompting & Configuration Reference (Flash + Pro)

## Prompt Structure

### Be Direct
Gemini 2.5 follows concise, direct instructions better than verbose Claude-style prompts. Lead with the action. Cut filler.

**Bad:** "I would like you to carefully analyze the following text and then extract the key information from it, making sure to be thorough and accurate."
**Good:** "Extract key information from this text."

### Data First, Instructions Last
For long-context inputs (documents, extracted text), put the source material BEFORE the task instructions. This is the opposite of Claude's preferred order.

```
<source_material>
{document text here}
</source_material>

Now extract the key terms from the material above.
```

### Formatting
Both XML tags and Markdown headers work. Pick one format per prompt and stay consistent.
- Use XML tags (`<raw_text>`, `<context>`) for data boundaries
- Use Markdown headers (`##`) for instruction structure
- Both models (Claude + Gemini) handle this well — safe for shared prompts

### Avoid Broad Negatives
"Do not infer", "do not guess", "never assume" — these cause Gemini to over-index and fail at basic logic.

**Instead, say what TO do:**
- Bad: "Do not add any words not in the source"
- Good: "Copy only words that appear in the source text"

## JSON / Structured Output

### Native JSON Mode
```javascript
generationConfig: {
  responseMimeType: 'application/json',
  // Optional: add responseSchema for validation
}
```
- Guarantees syntactically valid JSON
- Without retries, schema validity ~84%. With validator + one retry: ~97%
- Always use `cleanAndParse()` or equivalent — handle edge cases

### Schema Tips
- `description` fields in schemas guide the model's behavior — use them as mini-instructions
- Use `enum` for restricted values
- Keep schemas flat — deeply nested or complex schemas trigger 400 errors
- Shorten property names if schema is large

### Known JSON Issues
- Tool calls + structured output conflict on 2.5 models (fixed in Gemini 3)
- Overly restrictive schemas may trigger response refusals

## Thinking Config

### Gemini 3 (current — gemini-3-flash-preview)
**STATUS: gemini-3-flash-preview REJECTS thinkingConfig as of 2026-03-27. Thinking is DISABLED in agent-api.ts. Re-test when model is updated or GA.**

```javascript
// REST API format (inside generationConfig):
generationConfig: { thinkingConfig: { thinkingLevel: 'LOW' } }    // light reasoning
generationConfig: { thinkingConfig: { thinkingLevel: 'MEDIUM' } } // moderate reasoning
generationConfig: { thinkingConfig: { thinkingLevel: 'HIGH' } }   // full reasoning
```
Note: REST API uses camelCase `thinkingLevel` with UPPERCASE values inside `generationConfig`. The snake_case `thinking_level` and top-level placement only work with the Google AI Python/JS SDK, NOT the raw REST endpoint. Gemini 3 Pro (deprecated) and 3.1 Pro support thinking; Flash preview does not yet.

### Gemini 2.5 Flash (legacy)
```javascript
generationConfig: { thinkingConfig: { thinkingBudget: 0 } }  // disable
generationConfig: { thinkingConfig: { thinkingBudget: -1 } } // dynamic (max 8192)
generationConfig: { thinkingConfig: { thinkingBudget: N } }  // manual cap (1-24576)
```

### Critical: Thinking Tokens Consume maxOutputTokens
If `maxOutputTokens: 8192` and thinking is enabled, the model may use 4000+ tokens for thinking, leaving only ~4000 for actual output → **silent truncation**.

**Fix:** Set `maxOutputTokens: 65536` when thinking is enabled, OR use `thinkingBudget: 0` for simple tasks.

### When to Disable Thinking
- Transcription / verbatim copying
- Simple extraction / formatting
- OCR cleanup
- Any task where "just do it" is faster than reasoning about it

### When to Enable Thinking
- Multi-step reasoning
- Complex analysis
- Code generation requiring logic

## Gemini Pro (Composition & Reasoning Tasks)

### Model: `gemini-3.1-pro-preview`
- **Pricing:** $2.00 input / $12.00 output per 1M tokens (≤200K prompt), $4.00 / $18.00 above 200K
- **Context:** 1M tokens
- **`gemini-3-pro-preview` is DEPRECATED** (shut down March 2026). Use `gemini-3.1-pro-preview`.
- **Paid-only** — no free tier for Pro

### Pro Thinking Config
Pro supports `thinking_level` (Flash does not):
```javascript
generationConfig: {
  thinkingConfig: { thinkingLevel: 'LOW' },  // light reasoning, fast
  // or 'HIGH' for deep reasoning (more tokens, slower)
}
```
- Cannot be fully disabled on Pro (minimum thinking always occurs)
- Thinking tokens are billed at output rates
- For creative design with constraints: `LOW` is usually sufficient
- For complex multi-step reasoning: `HIGH`

### Pro vs Flash — When to Use Each
| Use Case | Model | Why |
|----------|-------|-----|
| Scene composition / layout selection | **Pro** | Creative decisions requiring nuance + reasoning |
| Panel content generation | **Flash** | High-volume, structured JSON output, cheaper |
| Document classification | **Flash** | Simple categorization, fast |
| Complex analysis / debugging | **Pro** | Reasoning quality matters |
| Image generation | **3.1 Flash Image** | Dedicated image model |

### Pro Config for Creative Composition
```javascript
generationConfig: {
  temperature: 0.8,           // Creative but consistent (Pro supports lower temps)
  topP: 0.95,
  maxOutputTokens: 16384,
  responseMimeType: 'application/json',
  thinkingConfig: { thinkingLevel: 'LOW' },
}
```

### Pro-Specific Tips
- Skip `responseSchema` for complex nested JSON — use `responseMimeType: 'application/json'` + TS interfaces in prompt instead
- Constrained creativity: define a design SPACE (acceptable ranges), not exact values
- Pro defaults to Material Design aesthetics — explicitly say "Do NOT use default blue" and provide project-specific palettes
- **Temperature: Google recommends 1.0 for Pro too** — lower values cause looping on reasoning tasks. Use 1.0 with `thinking_level` to control reasoning depth instead.
- Always provide "when to use" guidance for each option (layouts, palettes, etc.)
- **Thought signatures**: Required for multi-turn function calling. Official SDKs handle automatically. For REST API, preserve and return all thought signatures.
- **3 thinking levels**: `low` (fast, minimal cost), `medium` (balanced), `high` (default — most expensive). Always set explicitly or you get HIGH.

### Pro Config for Creative Composition (Updated)
```javascript
// REST API format
generationConfig: {
  temperature: 1.0,              // Google recommends 1.0, use thinking for control
  maxOutputTokens: 16384,
  responseMimeType: 'application/json',
  thinkingConfig: { thinkingLevel: 'LOW' },  // LOW for composition, MEDIUM for complex reasoning
}
```

## Temperature

| Model | Range | Default | Guidance |
|-------|-------|---------|----------|
| 2.5 Flash | 0-2 | 1 | 0-0.3 for deterministic, 0.7+ for creative |
| Gemini 3/3.1 Flash | 0-2 | 1 | **Do NOT lower below 1.0** — causes looping |
| Gemini 3.1 Pro | 0-2 | 1 | 0.7-0.9 for creative, 0.3-0.5 for structured |

### Our Standards
- **Gemini 3 Flash:** Always `temperature: 1.0` — required, lower causes looping
- **Gemini 3.1 Pro:** `0.8` for creative composition, `0.5` for structured analysis
- **Gemini 2.5 Flash (legacy):** `0.3` extraction, `0.7` generation, `1.0` creative

## Output Length

### Always Set maxOutputTokens Explicitly
**Default is 8192.** If you don't set it, output silently truncates mid-sentence with no warning or error. This is the #1 source of Gemini bugs.

### Our Standards
| Task | maxOutputTokens |
|------|-----------------|
| OCR extraction (per page) | 2048 |
| Read-along / study guide | 16384 |
| Multi-subject fan-in | 32768 |
| With thinking enabled | 65536 |

### 2.5 Flash Limits
- Max output: 65,536 tokens
- Max input: 1M tokens (but accuracy degrades past ~100K)

## Few-Shot Examples

- **2-3 diverse examples** is the sweet spot. More causes overfitting.
- Examples primarily teach output FORMAT — consistency matters more than content.
- Show the exact JSON structure you expect in examples.

## Long Context

- 1M token window, but accuracy degrades past ~100K tokens
- Past ~120-150K: fabrication risk increases significantly
- Force citations/quotes for grounding in long context
- Our `raw_markdown.slice(0, 30000)` is well within safe range (~7-10K tokens)

## Standard Gemini 3 Flash Config Block

### Extraction / Transcription
```javascript
generationConfig: {
  temperature: 1.0,
  maxOutputTokens: 16384,
  responseMimeType: 'application/json',
},
thinkingConfig: { thinking_level: 'minimal' },
```

### Generation (Guides, Quizzes)
```javascript
generationConfig: {
  temperature: 1.0,
  maxOutputTokens: 16384,
  responseMimeType: 'application/json',
},
thinkingConfig: { thinking_level: 'minimal' },
```

### Heavy Generation (Multi-section)
```javascript
generationConfig: {
  temperature: 1.0,
  maxOutputTokens: 32768,
  responseMimeType: 'application/json',
},
thinkingConfig: { thinking_level: 'minimal' },
```

## API Call Pattern

```javascript
const resp = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { /* see above */ },
    }),
  }
)
const data = await resp.json()
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
```

## Known Gotchas (Gemini 3 + 2.5 Flash)

1. **Silent truncation at 8K** — always set `maxOutputTokens` explicitly
2. **Gemini 3: temperature MUST be 1.0** — lower values cause looping and degraded output
3. **Gemini 3: `thinking_level` replaces `thinkingBudget`** — place `thinkingConfig` at top level, not inside `generationConfig`
4. **Broad negatives backfire** — "do not X" causes more failures than with Claude
5. **Thinking tokens eat output budget** — use `thinking_level: 'minimal'` for simple tasks
6. **Safety filters add 120-180ms latency** per call
7. **Complex schemas → 400 errors** — keep JSON schemas flat and simple
8. **Content filtering is less aggressive** than Claude's — Gemini handles educational content about war, colonialism, etc. without filtering (this is why we use it as primary)
9. **`gemini-3-flash-preview` is the current model** — migrate from `gemini-2.5-flash`

## Nano Banana 2 — Image Generation

### Model: `gemini-3.1-flash-image-preview` (Nano Banana 2)
Also available: `gemini-3-pro-image-preview` (Nano Banana Pro — better text rendering ~94-96% accuracy, $0.134+/image)

### Resolution Tiers & Pricing (per image)
| Resolution | Pixels | Cost | Use Case |
|-----------|--------|------|----------|
| `"512"` | 512px | $0.045 | Thumbnails, icons (3.1 Flash only) |
| `"1K"` | 1024px | $0.067 | Standard panels |
| `"2K"` | 2048px | $0.101 | Hero panels, backdrops |
| `"4K"` | 4096px | $0.151 | Full-page exports |

**CRITICAL: Case-sensitive** — `"1k"` silently falls back to 512px. Always uppercase: `"1K"`, `"2K"`, `"4K"`.

### Aspect Ratios (14 supported)
`1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`

Extreme ratios (`1:4`, `4:1`, `1:8`, `8:1`) useful for panoramic headers, vertical banners, ultrawide displays.

### API Configuration
```javascript
{
  contents: [{ parts: [{ text: imagePrompt }] }],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],  // MUST include BOTH — omitting TEXT causes silent failure
    imageConfig: {
      aspectRatio: '16:9',
      imageSize: '2K',
    },
    thinkingConfig: { thinkingLevel: 'minimal' },  // or 'high' for complex compositions
  },
  safetySettings: [...]
}
```

### Key Gotchas
- **Must include both `"TEXT"` and `"IMAGE"`** in responseModalities — omitting TEXT returns HTTP 200 with no image (silent failure)
- **1 image per request** — no `numberOfImages` param. Use concurrent requests for batches.
- **Up to 14 reference images**: 10 object fidelity + 4 character consistency (per-type caps are hard limits)
- **Google Search + Image Search grounding** available — model can search for real-world visual references before generating
- **Thinking**: `minimal` (default, fast) or `high` (for complex infographics/spatial reasoning). Thoughts are always billed.
- **Thought signatures**: Required for multi-turn image editing. Official SDKs handle automatically.

### Prompting Best Practices
1. **Narrative paragraphs, not keyword lists** — Flash excels with deep language understanding
2. **Prompt structure:** Subject → Composition → Style anchor → Color palette → Closing directive
3. **Prefix with "Generate an image of..."** to avoid text-only responses
4. **Natural-language colors** — "warm earth tones with navy accents" NOT hex codes
5. **Positive framing** — "use warm tones" NOT "don't use cool tones"
6. **Photographic terms work:** "wide-angle shot", "bird's-eye view", "rule of thirds"
7. **No text in images** — text rendering is ~90% accurate but unreliable. Overlay labels in frontend.
8. **Think like a creative director** — specific about subject, lighting, composition. Not a tag soup.

### Dark Mode / Light Mode Awareness
When generating images for apps that support dark AND light mode:
- **Light mode**: Use clean white or light-colored backgrounds, darker foreground elements
- **Dark mode**: Use dark/deep backgrounds (dark navy, charcoal, deep green), lighter foreground elements
- **Pass the current mode to the image prompt** — include "on a dark background" or "on a light/white background"
- **Alternatively**: Generate with transparent-feeling compositions (centered subjects, minimal background) that work in both modes
- **For backdrops**: Generate at low opacity anyway (8-12%), so background color matters less — but matching the mode still looks better

### Style Consistency Across Multiple Images
- Use a **reference image** + persistent style guide block for batch consistency
- Describe style comprehensively: technique, line style, shading, palette, forms, atmosphere
- Persistent chat sessions maintain context better than isolated calls
- **Restart conversations** if style drifts after many edits
- **Three-stage pipeline** (proven for batch illustration): 1) Idea generation → 2) Intelligent selection → 3) Consistent generation with style guide + references

### Professional Flat Vector Keywords
**Use:** `flat design`, `vector illustration`, `2D art`, `minimalist`, `clean lines`, `solid colors`, `geometric shapes`, `Corporate Memphis style`, `professional`, `modern`
**Avoid:** `photorealistic`, `3D render`, `cartoon`, `anime`, `painterly`, `sketch`, `hand-drawn`

### Common Mistakes
1. Vague prompts → generic results
2. Contradicting keywords ("realistic watercolor")
3. Negative phrasing doesn't work well
4. Over-specifying hex colors (describe relationally instead)
5. Skipping aspect ratio → bad cropping
6. Too many changes at once → iterate one thing per turn
7. Using lowercase `"1k"` instead of `"1K"` → silent 512px fallback
8. Omitting `"TEXT"` from responseModalities → silent failure

## Resource Center Builder Optimization (LEEDSmart)

The Resource Center uses Gemini 3 Flash for panel builders via `build-panel/index.ts`. Key optimizations to apply:

### Current State
- Model: `gemini-3-flash-preview` (BUILDER_MODEL in resource-advisor-config.ts)
- Image model: `gemini-2.0-flash-preview-image-generation` (hardcoded in build-panel)
- Output: fenced-block JSON parsing (correct for large outputs)
- No `responseMimeType` set (relies on prompt-guided fenced blocks)

### Recommended Optimizations
1. **Image model upgrade:** Change to `gemini-3.1-flash-image-preview` for better quality
2. **Image prompts (BUILDER_PROMPTS.image):** Rewrite to use narrative paragraph style per Nano Banana patterns. Describe composition, color palette, spatial arrangement in natural language. No hex codes.
3. **Builder prompts structure:** Move data context (the `dataContext` field) BEFORE the builder instructions. Gemini prefers data-first.
4. **maxOutputTokens:** Set explicitly per builder type (currently not set, defaults to 8192 which is fine for most panels but risky for large reports/tables)
5. **Small JSON builders:** Could benefit from `responseMimeType: 'application/json'` (gauge, callout, scorecard) but current fenced-block approach works reliably
6. **Technical diagram images:** Use composition hints (diagram, flowchart, comparison) with explicit spatial layout instructions. Green building palette. No text in images — overlay labels in frontend.

### DO NOT Change
- Body agent model (gemini-3-flash-preview is correct)
- Fenced-block parsing for large outputs (responseSchema unreliable for 16K+)
- Temperature (1.0 required for Gemini 3)

## Prompt Compatibility (Claude + Gemini)

Our prompts are shared between Claude (primary) and Gemini (fallback). Compatibility rules:
- XML tags (`<raw_text>`) — work in both
- Markdown headers (`##`) — work in both
- JSON examples in prompts — work in both
- Direct, action-oriented instructions — benefit both models
- Avoid Claude-specific features (XML thinking tags, tool_use in prompts)
