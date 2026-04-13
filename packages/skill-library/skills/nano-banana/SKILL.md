---
name: nano-banana
version: "1.0.0"
description: |
  Gemini image generation prompt engineering and best practices.
  Use when asked about: AI image generation, Gemini image generation, Nano Banana,
  educational illustrations, prompt engineering for images, or generating images
  with Google Gemini Flash models.
---

# Nano Banana — Image Generation for Study Partner

Prompt engineering and best practices for Gemini image generation in Wayka's Study Partner app.

## 1. Model & Pipeline

- **Model:** Gemini 3.1 Flash Image Preview (`gemini-3.1-flash-image-preview`)
- **Temperature:** Default 1.0 (recommended by Google for Flash, we don't override)
- **Inter-call delay:** 4 seconds (`INTER_CALL_DELAY`)
- **Pipeline:** `generateImage()` → `decodeBase64()` → `uploadImage()` to Supabase Storage
- **All-in-one:** `generateAndUpload()` wraps the full flow
- **Storage bucket:** `generated-images` (public, namespaced by feature)
- **Cost:** ~$0.067/image, budget per lesson ~$0.87-$1.33

## 2. Prompt Structure (Flash-Optimized)

Flash excels with **narrative paragraphs**, not keyword lists. Every prompt follows this structure:

1. **Subject** — What to create and why (educational context)
2. **Composition** — Layout, focal point, spatial arrangement (from `COMPOSITION_HINTS`)
3. **Style anchor** — `buildStyleAnchor(colorPalette)`: flat vector, soft rounded, warm educational
4. **Audience context** — `AUDIENCE_CONTEXT`: dyslexia-friendly, clear, encouraging
5. **Learning science context** — Purpose-specific framing (dual-coding, spaced repetition, etc.)
6. **Closing directive** — The "make it click" instruction

**Key principles:**
- Describe scenes narratively — Flash's strength is deep language understanding
- Specify line style, shading approach, color palette, background
- Natural-language colors > hex codes
- Positive framing > negative constraints ("use warm tones" not "don't use cool tones")
- Educational accuracy: "specify the need for accuracy, ensure inputs are factual"
- Consistency via detailed style descriptions (our `buildStyleAnchor` handles this)

## 3. Style Anchor

Shared across all prompts via `buildStyleAnchor(colorPalette)`:
- Warm, clean flat vector illustration
- Soft rounded shapes and gentle gradients
- Minimalist and approachable
- Color palette from `THEME_PALETTES` (natural-language descriptions per theme)
- Soft golden ambient light
- Visual elements only — no text, no photorealistic people

## 4. Theme Palettes (6 themes)

| Theme | Palette Description |
|-------|-------------------|
| default | warm earth tones — creamy ivory background, soft lavender-purple accents |
| love | soft romantic tones — blush pink background, warm rose and coral accents |
| sunrise | warm golden tones — cream-peach background, burnt orange and amber accents |
| happy | fresh natural tones — pale mint-cream background, bright lime green accents |
| winter | cool serene tones — icy pale blue background, steel blue and silver accents |
| san-domenico | school spirit tones — soft seafoam background, deep emerald green accents |

## 5. Prompt Builders (5 functions)

| Builder | Aspect | Use Case | Learning Science Context |
|---------|--------|----------|------------------------|
| `buildVisualCuePrompt` | 16:9 | Study guide sections | Dual-coded memory anchor (audio + visual) |
| `buildFlashcardPrompt` | 1:1 | Flashcard fronts | Spaced repetition visual trigger |
| `buildPictureMatchPrompt` | 1:1 | Game cards | Recognition memory retrieval exercise |
| `buildChatDiagramPrompt` | 4:3 | Chat tutor diagrams | "Aha moment" when text isn't clicking |
| `buildLessonCoverPrompt` | 16:9 | Lesson thumbnails | Anticipation/mood-setting (not learning) |

## 6. Composition Hints (7 types)

diagram, flowchart, comparison, timeline, icon, equation, concept — each with specific spatial arrangement instructions.

## 7. Rate Limits

| Feature | Limit | Delay |
|---------|-------|-------|
| Visual cues | 5 req / 5 min | 4s between calls |
| Flashcard images | 5 req / 5 min | 4s between calls |
| Chat diagrams | 3 req / 5 min | N/A (single image) |
| Picture-match | 10 req / 1 min (game) | 4s between calls |

## 8. Anti-Patterns

- NO text in images (text rendering is unreliable in image gen)
- NO photorealistic faces (use simplified abstract figures)
- NO decorative images (every image must depict a learning concept)
- NO negative constraints as primary framing (use positive descriptions)
- NO hex codes for colors (use natural-language descriptions)

## 9. Learning Science Integration

**Guiding Principle:** Every image must depict a concept the student is learning. Decorative images that don't directly relate to the learning objective cause cognitive overload.

**Evidence base:**
- **Dual-coding (Paivio 1971, Mayer 2009):** Words + pictures vs words alone: d = 1.67
- **Dyslexia-specific (WJARR 2025):** AUDIO + IMAGE > TEXT + IMAGE for dyslexic learners
- **Anti-decoration (Structural Learning):** Decorative images cause cognitive overload
- **Decoding bottleneck bypass:** Images bypass the text-processing deficit
- **Dyslexic learners rely more on pictures than text** when assimilating information
- **Visual cue reuse:** Same image across contexts (guide → flashcard) compounds memory anchor
- **Multi-sensory (Section 1.9):** Image + audio + haptic = 18-25% retention increase
- **Variable retrieval (Bjork 2024):** Image-based retrieval as one format rotation
- **Image selection EXCELLENT for dyslexia (Section 7.2):** Minimal reading

**Per-subject value:**
- Sciences/History: HIGH (concrete visual concepts)
- Math/Geometry: HIGH (spatial relationships)
- Grammar/Literary Analysis: LOW (abstract concepts harder to visualize)

## 10. Feature Implementation Status

| Feature | Status | Code |
|---------|--------|------|
| Study guide visual cues | LIVE | `generate-visual-cues/index.ts` |
| Lesson cover thumbnails | LIVE | Side-effect of first visual cue |
| Flashcard front images | LIVE | `generate-flashcard-images/index.ts` |
| Visual cue reuse | LIVE | Concept matching before generation |
| Picture-match game images | LIVE | Inline in `generate-game/index.ts` |
| Chat tutor diagrams | LIVE | `generate-chat-image/index.ts` |
| Visual recognition quiz (Phase 2) | PLANNED | Reuses existing images |

## 11. LEEDSmart Resource Center Images

The Resource Center uses Nano Banana for `image` panel type via `build-panel/index.ts`.

**Current:** Uses `gemini-2.0-flash-preview-image-generation` — should upgrade to `gemini-3.1-flash-image-preview`

**Green building image types that work well:**
- Building energy flow diagrams (heat arrows, insulation layers)
- LEED certification level visualizations (badge compositions)
- Sustainability comparison layouts (before/after)
- Material lifecycle flowcharts
- Indoor air quality concept diagrams
- Site analysis aerial-view compositions

**Palette for LEEDSmart:** Use the green building theme — warm earth tones with forest green accents, clean white backgrounds, sustainable/natural feel. Matches `rc-design-tokens.css` oklch green palette.

**Prompt template for building visualizations:**
```
Create a clean, professional [diagram type] showing [subject].
Layout: [spatial arrangement — centered, left-to-right flow, radial, etc.].
Use warm earth tones with forest green accents on a clean white background.
Style: flat vector with soft rounded shapes, minimalist and professional.
No text, labels, or numbers in the image — these will be overlaid in the UI.
[Specific composition details for this particular visualization.]
```

## 12. Key File Paths

- `supabase/functions/_shared/image-generation.ts` — Pipeline + all prompt builders
- `supabase/functions/generate-visual-cues/index.ts` — Study guide images
- `supabase/functions/generate-flashcard-images/index.ts` — Flashcard images + visual cue reuse
- `supabase/functions/generate-chat-image/index.ts` — Chat diagrams
- `supabase/functions/generate-game/index.ts` — Picture-match images (lines 645-695)
