---
name: unstructured-io
description: |
  Complete Unstructured.io API reference for document parsing and extraction.
  Use when asked about: Unstructured API parameters, partitioning strategies,
  chunking strategies, element types, metadata fields, table extraction,
  OCR configuration, VLM strategy, document processing pipelines,
  FormData API usage, element confidence scores, emphasized text extraction,
  body/furniture classification, sidebar detection, coordinate systems,
  or any Unstructured.io integration decision.
  Also use when building or modifying document parsing features,
  optimizing API calls, or evaluating parsing quality.
user-invocable: true
---

# Unstructured.io API Reference (Universal)

## API Endpoint
`POST /general/v0/general` (SaaS) or self-hosted equivalent.
Auth: `unstructured-api-key` header.
Content-Type: `multipart/form-data` (FormData).

## Partitioning Strategies

| Strategy | Speed | Quality | Coordinates | Use Case |
|----------|-------|---------|-------------|----------|
| `fast` | Fastest | Lower | No | Simple text docs, speed-critical |
| `hi_res` | Slowest | Highest | Yes (PixelSpace) | PDFs with tables, images, complex layouts |
| `ocr_only` | Medium | OCR-dependent | No | Scanned documents, image-only PDFs |
| `auto` | Varies | Good | Varies | Let Unstructured choose per page |
| `vlm` | Slow | Highest (2025+) | Partial | Vision Language Model — best for handwriting, whiteboards, complex layouts |

### Strategy Selection Guide
- **Student photo uploads (JPEG/PNG)**: Use `vlm` — handles handwriting, angled shots, poor lighting
- **PDF textbooks/worksheets**: Use `hi_res` — preserves tables, returns coordinates for sidebar detection
- **Plain text / RTF**: Use `fast` — no OCR needed
- **Complex mixed docs**: Use `auto` — routes per-page to optimal strategy

### VLM Strategy Details (2025+)
- Supports multiple VLM providers: **Anthropic** (Claude), **OpenAI** (GPT-4o), **AWS Bedrock**, **Google Vertex AI**
- Control model selection with two parameters:
  - `vlm_model`: Model ID (e.g., `claude-sonnet-4-20250514`, `gpt-4o`)
  - `vlm_model_provider`: Provider (e.g., `anthropic`, `openai`, `bedrock`, `vertexai`)
- Both must be specified together when using `vlm` strategy
- VLM generates HTML representations internally → preserves bold/italic emphasis
- **Strengths**: Handwriting, unusual layouts, multi-language scripts, whiteboard photos
- **Weaknesses**: Slower (5-15s per image), more expensive than hi_res
- **Coordinates**: May return them but less reliable than hi_res. Don't depend on coordinates from VLM — use element-type heuristics instead.
- **Content fidelity**: ~0.883 for typical educational content (images)

## Chunking Strategies

| Strategy | Behavior | Best For |
|----------|----------|----------|
| `basic` | Fixed-size character splits | Simple RAG ingestion |
| `by_title` | Splits at section headings, preserves structure | Structured docs (bids, reports) |
| `by_page` | One chunk per page | Page-oriented processing |
| `by_similarity` | Semantic similarity-based grouping | Topic clustering |
| None | Raw elements, no chunking | Full control over assembly |

**When NOT to chunk**: If you need raw element types for classification (body vs furniture), structured assembly, or page-level control — skip chunking entirely and process raw elements yourself.

## Key API Parameters (FormData)

### Partitioning
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `strategy` | string | `auto` | Partitioning strategy |
| `languages` | string | `""` | Language code (e.g., `eng`). Repeat key for multiple. |
| `pdf_infer_table_structure` | bool | `true` (hi_res) | Extract tables as HTML |
| `include_page_breaks` | bool | `false` | Track page boundaries — **always enable** for multi-page docs |
| `coordinates` | bool | `false` | Include bounding box coordinates — enable for hi_res sidebar detection |
| `unique_element_ids` | bool | `false` | Generate unique UUIDs instead of SHA-256 hashes |
| `encoding` | string | `utf-8` | Document encoding |
| `vlm_model` | string | varies | VLM model ID (required with `vlm` strategy) |
| `vlm_model_provider` | string | varies | VLM provider (required with `vlm` strategy) |

### Chunking (only when `chunking_strategy` is set)
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chunking_strategy` | string | none | Chunking method |
| `max_characters` | int | `500` | Hard max chunk size |
| `new_after_n_chars` | int | max_characters | Soft limit — start new chunk after this |
| `combine_under_n_chars` | int | `500` | Merge chunks smaller than this |
| `overlap` | int | `0` | Character overlap between chunks |
| `overlap_all` | bool | `false` | Apply overlap to all chunk boundaries |
| `include_orig_elements` | bool | `true` | Include pre-chunked originals in metadata — **disable** to save 30-50% response size |

### FormData Format Rules
- All values are strings: `formData.append('max_characters', '1500')`
- Booleans as strings: `formData.append('coordinates', 'true')`
- Arrays: repeat the key: `formData.append('languages', 'eng')` then `formData.append('languages', 'fra')`
- Do NOT use JSON arrays in FormData (e.g., NOT `'["eng"]'`)

## Element Types

| Type | Description | Body Content? |
|------|-------------|---------------|
| `Title` | Section headings | Yes |
| `NarrativeText` | Body text paragraphs | Yes |
| `Table` | Tabular data (has `text_as_html`) | Yes |
| `ListItem` | Bulleted/numbered items | Yes |
| `Header` | Page/document headers | Yes (but may be furniture) |
| `Footer` | Page footers | **No** — always furniture |
| `Image` | Embedded images | Context-dependent |
| `PageBreak` | Page boundary marker | **No** — structural marker |
| `FigureCaption` | Image/figure captions | **No** — usually furniture |
| `Address` | Physical addresses | Context-dependent |
| `EmailAddress` | Email addresses | Context-dependent |
| `Formula` | Mathematical formulas | Yes |
| `UncategorizedText` | Text that couldn't be classified | **Maybe** — apply heuristics |

### Body vs Furniture Classification

**Furniture** (always skip):
- `Footer`, `PageBreak`, `FigureCaption`
- `UncategorizedText` with < 20 chars (page numbers, margin annotations)
- `UncategorizedText` with `detection_class_prob < 0.4` (misclassified noise)
- Pure numeric text (`/^\d{1,4}$/` — page numbers)
- Elements with x-center < 12% or > 88% of page width (sidebars/margins — hi_res only)

**Body** (always include):
- `NarrativeText`, `Title`, `Header`, `ListItem`, `Table`, `Formula`
- `UncategorizedText` with ≥ 20 chars and reasonable confidence

### Sidebar Detection (Coordinate-Based — hi_res PDFs only)

When `coordinates: true` is enabled for hi_res:
```
coordinates.points = [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
coordinates.system = "PixelSpace"
coordinates.layout_width = page width in pixels
coordinates.layout_height = page height in pixels
```

Algorithm:
1. Get all x-coordinates from `points`
2. Compute x-center: `(minX + maxX) / 2 / layout_width`
3. If x-center < 0.12 or > 0.88 → sidebar/margin content → classify as furniture

**VLM does NOT reliably return coordinates** — use element-type + text-length heuristics as primary classification for images.

## Element Structure

```json
{
  "type": "NarrativeText",
  "element_id": "abc123...",
  "text": "The extracted text content",
  "metadata": {
    "page_number": 1,
    "parent_id": "def456...",
    "text_as_html": "<table>...</table>",
    "coordinates": {
      "points": [[x1,y1], [x2,y2], [x3,y3], [x4,y4]],
      "system": "PixelSpace",
      "layout_width": 612,
      "layout_height": 792
    },
    "detection_class_prob": 0.92,
    "emphasized_text_contents": ["key term", "important concept"],
    "emphasized_text_tags": ["b", "b"],
    "is_continuation": false,
    "languages": ["eng"],
    "filename": "document.pdf",
    "filetype": "application/pdf",
    "link_urls": ["https://..."],
    "link_texts": ["click here"],
    "orig_elements": [...]
  }
}
```

## Critical Metadata Fields

### High-Value Fields (Use These)
| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `page_number` | `metadata` | int | 1-indexed page number. Always available. |
| `text_as_html` | `metadata` | string | HTML table representation. Only on `Table` elements. Prefer over `.text` for tables. |
| `detection_class_prob` | `metadata` | float (0-1) | ML confidence for element type. Low = uncertain OCR/detection. Available for hi_res, sometimes VLM. |
| `emphasized_text_contents` | `metadata` | string[] | Text marked bold/italic in source. Critical for identifying key terms, vocabulary words, important concepts. |
| `emphasized_text_tags` | `metadata` | string[] | HTML tags (`b`, `i`, `em`, `strong`). Parallel array with `emphasized_text_contents`. |
| `coordinates` | `metadata` | object | Bounding box in PixelSpace. Includes `layout_width`/`layout_height`. Only reliable for hi_res. |
| `parent_id` | `metadata` | string | Parent element ID. Useful for hierarchical document structure. |
| `is_continuation` | `metadata` | bool | Whether element continues from previous page. Useful for paragraph merging. |
| `languages` | `metadata` | string[] | Detected languages for the element. |

### Lower-Priority Fields
| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `link_urls` | `metadata` | string[] | URLs found in the element text |
| `link_texts` | `metadata` | string[] | Anchor text for found URLs |
| `orig_elements` | `metadata` | object[] | Pre-chunked original elements (only when chunking). Large — disable with `include_orig_elements=false`. |
| `filename` | `metadata` | string | Source filename |
| `filetype` | `metadata` | string | Source MIME type |

## Table Extraction

When `strategy=hi_res` and `pdf_infer_table_structure=true`:
- Tables are returned as type `Table`
- `metadata.text_as_html` contains the HTML table markup
- `.text` contains a plain-text representation
- Prefer `text_as_html` for LLM consumption (preserves row/column structure)
- For TTS/Read-Along: skip tables entirely (not speech-friendly)

## OCR Configuration

- Set `languages` explicitly for best accuracy (e.g., `eng` for English)
- Multi-language: repeat the key — `formData.append('languages', 'eng')` then `formData.append('languages', 'spa')`
- `hi_res` uses Tesseract OCR by default
- `ocr_only` forces OCR on all pages (even if text is extractable)
- `detection_class_prob` indicates OCR/detection confidence

### Language Codes (Common)
| Code | Language |
|------|----------|
| `eng` | English |
| `spa` | Spanish |
| `fra` | French |
| `deu` | German |
| `ita` | Italian |
| `por` | Portuguese |
| `jpn` | Japanese |
| `zho` | Chinese |
| `kor` | Korean |
| `ara` | Arabic |

## Confidence Scoring

### When `detection_class_prob` is available (hi_res)
- Use raw scores directly
- Average across all elements for document-level confidence
- Elements with < 0.4 confidence → likely misclassified → treat as furniture

### When NOT available (VLM, fast)
Estimate from content signals:
- 0 meaningful elements → 0.1 (failed extraction)
- < 30 chars total → 0.2 (near-empty)
- 1 element, < 100 chars → 0.35 (minimal)
- High noise ratio (> 60% empty UncategorizedText) → 0.4
- Moderate noise (> 30%) → 0.6
- Otherwise → 0.85 (good extraction)

## Architecture Patterns

### Pattern: Structured Element Storage
Store raw classified elements as JSONB alongside assembled markdown:
```typescript
interface StoredElement {
  type: 'NarrativeText' | 'Title' | 'Header' | 'ListItem' | 'Table' | 'Formula'
      | 'FigureCaption' | 'Footer' | 'UncategorizedText' | 'PageBreak'
  text: string
  page: number           // 1-indexed
  confidence?: number    // detection_class_prob
  emphasis?: string[]    // bold/italic terms
  html?: string          // text_as_html (tables only)
  body: boolean          // true = main content, false = furniture
}
```

Benefits:
- Deterministic markdown reassembly (no LLM rewriting)
- Page-level filtering for multi-subject splitting
- Body/furniture classification tunable without re-extraction
- Confidence-aware downstream processing

### Pattern: Deterministic Markdown Assembly
Build clean markdown from body elements only — no LLM involved:
```typescript
function elementsToCleanMarkdown(elements: StoredElement[]): string {
  // Filter to body elements only
  // Add page separators (--- between pages)
  // Title → ## heading, Header → ### heading
  // ListItem → - bullet, Table → html, Formula → $$...$$
  // NarrativeText → plain text with emphasis applied
  // Join with \n\n, normalize 3+ newlines to 2
}
```

### Pattern: Emphasis Application (Dyslexia-Aware)
For dyslexic readers: apply **bold only** — italic is harder to read (BDA guideline).
For general use: apply both bold (`**`) and italic (`*`).

```typescript
// Dyslexia-friendly
function applyEmphasis(text: string, emphasis?: string[]): string {
  // Skip single chars / very short terms
  // Bold only: result.replace(/\bterm\b/i, '**term**')
}

// General
function applyEmphasisFull(text: string, contents: string[], tags: string[]): string {
  // Bold for b/strong, italic for i/em
  // wrapper = (tag === 'b' || tag === 'strong') ? '**' : '*'
}
```

### Pattern: OCR Fallback Wrapping
When Unstructured fails, wrap Sonnet/Gemini OCR text as StoredElement[]:
```typescript
function textToStoredElements(text: string, pageNumber = 1): StoredElement[] {
  // Split on \n\n into paragraphs
  // Detect headings: ALL CAPS < 80 chars, or ## markdown markers
  // Return as NarrativeText or Title elements with body: true
}
```

## Timeout & Error Handling

- **Recommended timeout**: 45s for VLM/hi_res (can be slow)
- **AbortController pattern**: Set timeout, clear on response, abort on timeout
- **Always wrap in try/catch**: Callers should fall back to LLM-based OCR if Unstructured fails
- **Check elementCount > 0**: Empty response = extraction failed silently
- **Check lowConfidence**: Average confidence < 0.5 = unreliable output

## Performance Tips

1. **Skip chunking** when you need raw elements — chunking adds overhead and loses element-type information
2. **Disable `include_orig_elements`** when chunking — saves 30-50% response size
3. **Disable `coordinates`** for VLM (unreliable) and fast (not applicable)
4. **Enable `coordinates`** only for hi_res when you need sidebar detection
5. **Set `languages` explicitly** — auto-detection is slower and less accurate
6. **VLM is 5-15s per image** — factor into edge function timeout budget
7. **hi_res is 3-10s for typical PDFs** — faster than VLM for most docs
8. **`include_page_breaks: true`** — negligible cost, critical for multi-page assembly

## Common Gotchas

1. **VLM coordinates are unreliable** — don't depend on them for sidebar detection. Use element-type heuristics for images.
2. **VLM puts real content in UncategorizedText** — don't filter out all UncategorizedText. Only filter short/empty ones.
3. **FormData booleans are strings** — `'true'` not `true`
4. **Language arrays use repeated keys** — NOT JSON arrays
5. **`text_as_html` only exists for Table elements** — check type before accessing
6. **`detection_class_prob` not available for VLM/fast** — use heuristic confidence
7. **`is_continuation` not always set** — treat undefined as false
8. **Empty `.text` elements exist** — always filter `el.text?.trim()` before processing
9. **Coordinates use PixelSpace** — origin top-left, Y increases downward
10. **`layout_width`/`layout_height` in coordinates** — use for normalization instead of estimating from max point values
