---
name: tensorlake
description: |
  Tensorlake Document AI — complete API reference, integration patterns, and best practices.
  Use when asked about: Tensorlake API, document parsing, structured extraction,
  schema-based extraction, table extraction, page classification, large PDF handling,
  document ingestion pipelines, Tensorlake vs Unstructured comparison,
  OCR model selection, webhook integration, polling patterns, dense table parsing,
  multi-page document processing, PDF chunking, bounding box extraction,
  document classification, pattern-based partitioning, chart extraction,
  or any Tensorlake integration decision.
  Also use when building or modifying document parsing features that use Tensorlake,
  migrating from Unstructured.io, or evaluating document parsing quality.
user-invocable: true
---

# Tensorlake Document AI — Complete Reference

## Overview

Tensorlake turns documents into layout-aware Markdown and schema-validated structured JSON. REST API at `https://api.tensorlake.ai`. Python SDK available (no JS/TS SDK). Auth: Bearer token (`tl_apiKey_*`).

**Pricing**: $0.01/page. No free tier (100 credits on signup = 100 pages). Pay-as-you-go.
**Accuracy**: 91.7% F1 on enterprise docs, 86.79% TEDS for table structure (vendor-published benchmarks).

## Core API — Single Endpoint Does Everything

### Parse Documents
```
POST https://api.tensorlake.ai/documents/v2/parse
Authorization: Bearer tl_apiKey_...
Content-Type: application/json        (for file_url)
Content-Type: multipart/form-data     (for file upload)
```

**Request body (verified from OpenAPI spec 2026-03-25):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes* | Document file (multipart only) |
| `file_url` | string | Yes* | URL to document (JSON body) |
| `file_id` | string | Yes* | ID of previously uploaded file |
| `raw_text` | string | Yes* | Raw text content to parse |
| `mime_type` | string | No | File type override (required with raw_text) |
| `page_range` | string | No | Comma-separated page numbers |
| `file_name` | string | No | Name of file (with file_id only) |
| `labels` | object | No | Additional metadata |
| `parsing_options` | object | No | Document parsing configuration |
| `structured_extraction_options` | array | No | Array of schema extraction configs |
| `page_classifications` | array | No | Page classification categories (**NOT** `page_classes` — that's the response field) |
| `enrichment_options` | object | No | `{ table_summarization: true, figure_summarization: true, chart_extraction: true, key_value_extraction: true }` |

**IMPORTANT field name corrections:**
- ~~`output_mode`~~ — does NOT exist. Removed.
- ~~`page_classes`~~ → `page_classifications` (input). Response field IS `page_classes`.
- ~~`enrichments`~~ → `enrichment_options` (object with boolean flags, NOT an array)
- ~~`model_provider`~~ — only valid INSIDE `structured_extraction_options[]` items, not at top level
- ~~`partition_strategy`~~ — only valid INSIDE `structured_extraction_options[]` items, not at top level

*Exactly one file source required: `file`, `file_url`, `file_id`, or `raw_text`.

**POST Response (always async):**
```json
{ "parse_id": "abc123", "created_at": "2026-03-25T12:00:00Z" }
```

**GET Result Response** (`GET /documents/v2/parse/{parse_id}`):
```json
{
  "parse_id": "abc123",
  "status": "successful",
  "pages": [
    {
      "page_number": 1,
      "page_fragments": [
        { "content": "## Section Title\n\nParagraph text...", "fragment_type": "text", "bbox": {...} },
        { "content": "<table>...</table>", "fragment_type": "table", "bbox": {...} }
      ],
      "dimensions": { "width": 612, "height": 792 },
      "classification_reason": "Contains fixture schedule data"
    }
  ],
  "chunks": [
    { "content": "Section text...", "page_number": 1 }
  ],
  "merged_tables": [
    { "merged_table_id": "mt_1", "merged_table_html": "<table>...</table>", "start_page": 2, "end_page": 3, "pages_merged": [2, 3], "summary": "Fixture schedule spanning pages 2-3" }
  ],
  "structured_data": [...],
  "page_classes": [
    { "page_class": "fixture_schedule", "page_numbers": [2, 3], "classification_reasons": [...] }
  ],
  "parsed_pages_count": 7,
  "total_pages": 7,
  "tasks_completed_count": 12,
  "tasks_total_count": 12,
  "usage": { "tokens": 15000, "pages_parsed": 7 },
  "error": null
}
```

**IMPORTANT:** Tables are NOT a top-level array. They appear as:
- `pages[].page_fragments[]` with `fragment_type: "table"` (per-page)
- `merged_tables[]` for tables spanning page breaks (cross-page)

### Async Job Pattern — ALWAYS Async
Every POST returns only `{parse_id, created_at}`. You MUST poll for results:
```
POST /documents/v2/parse → { "parse_id": "abc123", "created_at": "..." }
GET /documents/v2/parse/{parse_id} → { "status": "pending" | "processing" | ... | "successful" | "failure" }
```

**Status progression:** `pending` → `processing` → `detecting_layout` → `detected_layout` → `extracting_data` → `extracted_data` → `formatting_output` → `formatted_output` → `successful` (or `failure`)

**SSE streaming supported:** Same GET endpoint with `Accept: text/event-stream` for real-time status.

Poll every 3-5 seconds with exponential backoff. Jobs queue in `pending` when concurrency limits are hit.

## Structured Extraction (Schema-Based)

Define JSON schemas to extract specific data from documents. Tensorlake applies schemas during parsing — no separate LLM call needed.

**Schema definition (example: invoice line items):**
```json
{
  "structured_extraction_options": [
    {
      "schema_name": "InvoiceLineItems",
      "json_schema": {
        "type": "object",
        "properties": {
          "line_items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "description": { "type": "string", "description": "Product or service description" },
                "quantity": { "type": "number", "description": "Quantity ordered or delivered" },
                "unit_price": { "type": "number", "description": "Price per unit in the document's currency" },
                "total": { "type": "number", "description": "Line total (quantity x unit_price)" },
                "sku": { "type": "string", "description": "Product SKU or item code if present" }
              },
              "required": ["description", "quantity", "unit_price", "total"]
            }
          }
        },
        "required": ["line_items"]
      },
      "partition_strategy": "page",
      "model_provider": "gemini3"
    }
  ]
}
```

**Schema per-item fields (verified from API spec + research):**
| Field | Required | Description |
|-------|----------|-------------|
| `schema_name` | Yes | Identifier used to match in response |
| `json_schema` | Yes | Standard JSON Schema |
| `partition_strategy` | No | `"none"` (default), `"page"`, `"section"`, or pattern object |
| `page_classes` | No | Filter: only run on pages matching these classifications |
| `provide_citations` | No | Return bounding boxes per field (true/false) |
| `prompt` | No | Custom LLM instructions for this schema's extraction |
| `model_provider` | No | `"tensorlake"` (default), `"gpt_4o_mini"`, `"sonnet"`, `"gemini3"` |
| `skip_ocr` | No | Use VLM directly on images instead of OCR text |

**Schema constraints:**
- Nullable fields: use sentinel values (-1 for numbers, "unknown" for strings). All fields MUST be in the `required` array. Do NOT use `type: ['string', 'null']` — Tensorlake's validator may reject array types.
- Max 5 levels of nesting depth
- Field descriptions act as extraction instructions — be specific about visual cues
- `page_classes` filter lets you route schemas to specific page types in a single API call
- `provide_citations: true` returns bounding-box coordinates per extracted field
- Custom `prompt` per schema adds domain-specific extraction guidance

**Structured extraction response:**
```json
{
  "structured_data": [
    {
      "data": { "fixtures": [...] },
      "schema_name": "FixtureSchedule",
      "page_numbers": [2, 3],
      "citations": [
        {
          "field": "fixtures[0].flow_rate",
          "bounding_box": { "x": 340, "y": 215, "width": 60, "height": 18 },
          "page_number": 2
        }
      ]
    }
  ]
}
```

## Page Classification

Classify each page into categories during parsing. Define domain-specific categories:
```json
{
  "page_classes": [
    { "name": "invoice", "description": "Invoice with line items, totals, payment terms" },
    { "name": "contract", "description": "Legal agreement with terms and signatures" },
    { "name": "specification", "description": "Technical specifications, product data sheets" },
    { "name": "schedule", "description": "Tables with equipment, materials, or resource listings" },
    { "name": "drawing", "description": "Technical drawings, floor plans, diagrams" },
    { "name": "form", "description": "Fillable forms, checklists, applications" },
    { "name": "narrative", "description": "Reports, letters, memos, written descriptions" },
    { "name": "cover_page", "description": "Title pages, table of contents, cover sheets" }
  ]
}
```

Response includes per-page classification with confidence.

## Partition Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `none` | Whole document as one chunk | Small docs, single extraction |
| `page` | One chunk per page | Page-level extraction (schedules) |
| `section` | Split at detected section boundaries | Specs with clear sections |
| Pattern-based | Regex-defined boundaries | Split at credit headers, section markers |

**Pattern partitioning example** (split at section headers):
```json
{
  "partition_strategy": "pattern",
  "partition_pattern": "^(?:Section|Chapter|Part)\\s+\\d+"
}
```

## OCR Models

| Model | Strengths | Weaknesses | Bounding Boxes |
|-------|-----------|------------|----------------|
| `tensorlake` (default) | Best accuracy, table TEDS 86.79% | Slower | Yes |
| `gemini3` | Visual reasoning, legend interpretation, symbol counting | No bounding boxes, rate-limited | No |
| `model03` | Fast, good for simple layouts | Less accurate on complex tables | Yes |

**When to use Gemini 3 model:**
- Construction floor plans with symbol legends
- Chart/diagram interpretation
- Documents requiring visual reasoning beyond OCR
- When bounding boxes are not required

**When NOT to use Gemini 3:**
- When you need bounding box coordinates
- When strikethrough/style detection matters
- When precise spatial data is required

## Large Document Handling

**Auto-chunking:** Tensorlake automatically splits large PDFs into 25-page segments for processing, then reassembles results. No manual splitting needed.

**Multi-page table continuity:** Tables spanning page breaks are merged automatically. Headers are carried across pages.

**File size limits:** Up to 200MB+ documented. No explicit page limit.

**Concurrency:** Jobs queue in `pending` when concurrency limits are hit per project. Multiple documents process in parallel up to project concurrency limit.

## Table Extraction Deep Dive

Tensorlake's strongest feature for construction documents:

**Dense table model:**
- Handles ~1,500 cells per table
- Preserves merged cells and multi-row headers
- Returns structured HTML compatible with `pandas.read_html()`
- Automatic splitting for 500+ row tables

**Table response format:**
```json
{
  "tables": [
    {
      "html": "<table><thead><tr><th>Fixture</th><th>GPF</th></tr></thead><tbody><tr><td>WC</td><td>1.28</td></tr></tbody></table>",
      "page_number": 3,
      "bounding_box": { "x": 50, "y": 200, "width": 700, "height": 400 },
      "row_count": 12,
      "col_count": 6
    }
  ]
}
```

**vs Unstructured table extraction:**
- Unstructured: Returns `text_as_html` in element metadata — often garbles column alignment on dense schedules
- Tensorlake: Dedicated table model preserves structure, handles merged cells, multi-row headers

## Enrichments

Optional post-processing features (some cost extra):

| Enrichment | Description | Use Case |
|-----------|-------------|----------|
| `figure_summarization` | AI summary of diagrams/drawings | Understanding floor plan content |
| `table_summarization` | Enriched table captions | Context for data tables |
| `chart_extraction` | Convert charts → structured JSON | Energy performance charts |
| `signature_detection` | Locate signatures | Approval tracking |
| `barcode_detection` | Decode barcodes + bounding boxes | Document tracking |

## Webhook Integration

Tensorlake uses Svix for webhook delivery:

**Setup:**
```
POST /webhooks/configure
{
  "endpoint_url": "https://your-function.supabase.co/tensorlake-webhook",
  "events": ["parse.completed", "parse.failed"]
}
```

**Webhook payload:**
```json
{
  "event_type": "parse.completed",
  "job_id": "job_xxx",
  "status": "completed",
  "metadata": { "page_count": 127, "processing_time_ms": 45000 }
}
```

**Alternative: Polling** (simpler for MVP):
```typescript
async function pollForCompletion(parseId: string, apiKey: string, maxWaitMs = 300000): Promise<TensorlakeResult> {
  const start = Date.now()
  let delay = 3000 // Start at 3s
  const TERMINAL = new Set(['successful', 'failure'])

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`https://api.tensorlake.ai/documents/v2/parse/${parseId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const data = await res.json()

    if (data.status === 'successful') return data
    if (data.status === 'failure') throw new Error(`Tensorlake parse failed: ${data.error}`)

    // Log progress for debugging
    console.log(`[tensorlake] ${parseId}: ${data.status} (${data.tasks_completed_count ?? 0}/${data.tasks_total_count ?? '?'})`)

    await new Promise(r => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 15000) // Cap at 15s
  }
  throw new Error(`Tensorlake parse timed out after ${maxWaitMs}ms`)
}
```

## Deno / Supabase Edge Function Integration

No SDK needed — use `fetch()` directly:

```typescript
// Upload and parse a document from Supabase Storage
async function parsewithTensorlake(
  fileBytes: Uint8Array,
  filename: string,
  apiKey: string,
  options?: { schemas?: object[], pageClasses?: object[] }
): Promise<TensorlakeResult> {
  const formData = new FormData()
  formData.append('file', new File([fileBytes], filename))
  formData.append('output_mode', 'markdown')

  if (options?.schemas) {
    formData.append('structured_extraction_options', JSON.stringify(options.schemas))
  }
  if (options?.pageClasses) {
    formData.append('page_classes', JSON.stringify(options.pageClasses))
  }

  const res = await fetch('https://api.tensorlake.ai/documents/v2/parse', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tensorlake API error ${res.status}: ${err}`)
  }

  const data = await res.json()

  // Always async — poll for completion using parse_id
  return pollForCompletion(data.parse_id, apiKey)
}
```

**Supabase Storage signed URL pattern** (avoids uploading file bytes):
```typescript
// Generate signed URL for the file in storage
const { data: signedUrl } = await admin.storage
  .from('documents')
  .createSignedUrl(filePath, 3600) // 1 hour expiry

// Pass URL directly — no file upload needed
const formData = new FormData()
formData.append('file_url', signedUrl.signedUrl)
formData.append('output_mode', 'markdown')
// ... rest of params
```

## Mapping Tensorlake Response → Existing Element Schema

To drop into an existing Unstructured-based pipeline without changing downstream code:

```typescript
interface UnstructuredElement {
  type: string
  text: string
  metadata: {
    page_number?: number
    text_as_html?: string
    detection_class_prob?: number
    emphasized_text_contents?: string[]
  }
}

function mapTensorlakeToElements(tlResponse: TensorlakeResult): UnstructuredElement[] {
  const elements: UnstructuredElement[] = []

  // Map page fragments (the primary content source)
  for (const page of tlResponse.pages ?? []) {
    for (const frag of page.page_fragments ?? []) {
      elements.push({
        type: frag.fragment_type === 'table' ? 'Table'
             : frag.fragment_type === 'heading' ? 'Title'
             : 'NarrativeText',
        text: frag.content,
        metadata: {
          page_number: page.page_number,
          text_as_html: frag.fragment_type === 'table' ? frag.content : undefined,
          detection_class_prob: 0.95, // Tensorlake doesn't expose per-element confidence
        }
      })
    }
  }

  // Map merged tables (cross-page tables reassembled by Tensorlake)
  for (const mt of tlResponse.merged_tables ?? []) {
    elements.push({
      type: 'Table',
      text: mt.summary ?? '',
      metadata: {
        text_as_html: mt.html,
        detection_class_prob: 0.95,
      }
    })
  }

  return elements
}
```

## Comparison: Tensorlake vs Alternatives

| Feature | Tensorlake | Unstructured.io | LlamaParse | Azure DI | Gemini Direct |
|---------|-----------|-----------------|-----------|---------|--------------|
| Per-page cost | $0.01 | $0.01 | $0.003-$0.11 | $0.01 | ~$0.001 |
| Free tier | 100 pages | 15K pages | 10K credits/mo | 500 pages/mo | Yes |
| Table TEDS | 86.79% | Not published | Not published | 78.14% | Not benchmarked |
| Schema extraction | Built-in | No | JSON mode | Custom models | responseSchema |
| Bounding boxes | Yes (not with gemini3) | Coordinates option | No | Yes | No |
| Large PDF chunking | Auto 25-page | Manual/SDK split | Auto | Auto | Manual |
| JS/TS SDK | No (REST only) | Yes | Yes | Yes | Yes |
| Page classification | Built-in | No | No | No | Manual prompt |
| Multi-page tables | Auto-merge | No | Partial | Yes | Manual |
| Webhooks | Yes (Svix) | No | No | No | No |

## Known Limitations & Gotchas

1. **No JS/TS SDK** — must use REST API from Deno/Node. Straightforward but requires building a client.
2. **All schema fields must be `required`** — cannot have optional fields in extraction schemas. Use sentinel values ("unknown", 0) instead of null.
3. **Max 5 levels nesting** in JSON schemas.
4. **No bounding boxes with gemini3 model** — use `tensorlake` or `model03` if you need spatial data.
5. **Startup risk** — bootstrapped company (Vertex Labs, SF). Keep Unstructured as fallback.
6. **Benchmarks are vendor-published** — no independent third-party validation of 91.7% F1 claim.
7. **Gemini excluded from benchmarks** — deliberate omission; HN community flagged this.
8. **Processing speed varies** — HN reports of 10+ minute processing during traffic spikes.
9. **No head-to-head vs Unstructured** in any published benchmark.
10. **Supabase Edge Function timeout** (~60s default, 150s background) — large docs WILL exceed this. Must use polling with background task pattern.
11. **`content` field is nested object** — `frag.content` returns `{ content: string, summary: string|null }`, NOT a plain string. Must access `frag.content.content` for the actual text. Using `String(frag.content)` produces `"[object Object]"`.
12. **`model_provider` in schemas** — the API spec table lists `model_provider` as an optional field in `structured_extraction_options` items. Valid values: `"tensorlake"` (default), `"gpt_4o_mini"`, `"sonnet"`, `"gemini3"`. Omitting it lets Tensorlake choose the best model. Only override when you need a specific model's capabilities (e.g., `"gemini3"` for visual-reasoning on hand-drawn plans).
13. **Nullable types: do NOT use `type: ['string', 'null']`** — use sentinel values in descriptions instead (e.g., `"or 'unknown' if not found"`). Array-type syntax may be rejected by Tensorlake's JSON Schema validator.
14. **Construction drawings return title block stamps** — large multi-page drawing sets produce 100+ identical elements (the title block border on every page). Deduplicate by text content before storing elements.
15. **`page_classifications` is the INPUT field name, `page_classes` is the RESPONSE field name** — different names for the same concept.
16. **No parse-ID reuse** — each POST to `/documents/v2/parse` creates a new independent job. You cannot reference a previously-parsed document to add schema extraction. Phase 2 fan-out jobs must re-download the source file.
17. **No cancel API** — if a parse job times out on the client side, the job continues running on Tensorlake's servers. Orphaned jobs consume billable processing but are otherwise harmless.
18. **Internal auto-chunking at ~25 pages** — Tensorlake splits large PDFs into ~25-page internal segments, processes them, then reassembles. This is transparent — you get one consolidated response. Do NOT attempt client-side chunking as it breaks cross-page table merging and title block deduplication.
19. **Concurrent jobs queue per-project** — not per API key. Under heavy load, jobs enter `pending` state until project concurrency slots open.
20. **`page_range` format** — accepts comma-separated pages and/or ranges: `"1,3-5,8,10-20"`. Use range notation for consecutive runs to keep the request compact.

## Best Practices

### Schema design
- Use **narrow, domain-specific schemas** (not one giant schema). ExtractBench research shows reliability degrades sharply as schema breadth grows.
- Include rich `description` fields — they act as extraction instructions for the model.
- Use `partition_strategy: "page"` for table/schedule-heavy documents.
- Specify units, allowed enums, and abstention rules in descriptions.
- Remember: all fields must be `required` — design schemas accordingly.

### Document routing
- Use `page_classes` to classify pages by type or category.
- Route only relevant pages to expensive extraction schemas.
- First-page extraction (cover page, title block) identifies document metadata cheaply.

### Table extraction
- Tensorlake excels at dense tables (schedules, financial tables, spec sheets).
- Enable `table_summarization` enrichment for context.
- Multi-page table continuity works automatically — no special handling needed.
- For 500+ row tables: Tensorlake auto-splits and reassembles.

### Large documents (100+ pages)
- Tensorlake auto-chunks to 25-page segments internally.
- Use page classification to identify high-value pages before schema extraction.
- Apply extraction schemas only to classified relevant pages to reduce cost.
- Budget: ~$1.27 for a 127-page doc at $0.01/page.

### Scanned vs native text PDFs
- Default model (`tensorlake`) handles both scan and native text.
- For heavily rotated pages: pre-process with OCRmyPDF `--rotate-pages --deskew`.
- For mixed scan+text PDFs: use `skip_ocr=false` (default) — Tensorlake decides per-page.
- Use `gemini3` model when visual reasoning matters more than bounding boxes.

### Migrating from Unstructured.io
- Tensorlake is a drop-in replacement at the HTTP call level.
- Map Tensorlake chunks → Unstructured element format using the mapping function above.
- Keep existing element storage, downstream agents, and UI unchanged.
- Use a feature flag to run both in parallel during validation.
- Key wins: better table extraction, auto-chunking, schema extraction, no manual PDF splitting.

## Files API — Upload & Reuse (Verified 2026-03-29)

Upload a file once, reuse the `file_id` across multiple parse calls — eliminates re-downloading for Phase 2 fan-out.

**Upload endpoint:**
```
PUT https://api.tensorlake.ai/documents/v2/files
Content-Type: multipart/form-data
Authorization: Bearer tl_apiKey_...

file_bytes: <binary file>
```

**Response:** `{ "file_id": "file_xxx", "created_at": "..." }`

**Key behaviors (tested):**
- Same file uploaded twice returns same `file_id` (deduplication)
- `file_id` works with ALL features: `page_classifications`, `structured_extraction_options`, `enrichment_options`, `page_range`
- `file_id` works with `model_provider: 'gemini3'`
- Upload limit: 1GB per file
- Expiry: not documented
- File ID prefix: `file_` (v2 format)

**Usage in parse calls:**
```json
{ "file_id": "file_xxx", "structured_extraction_options": [...] }
```
When `file_id` is set, do NOT include `file_url` — they are mutually exclusive.

## Known Bug: Structured Extraction on Real PDFs (as of 2026-03-29)

**Status:** Reported to Tensorlake support. Trace ID: `fS1zpa03UvqxuoXipUwYY`

Structured extraction via `structured_extraction_options` works perfectly on `raw_text` input but fails with `'NoneType' object is not iterable` when the input is a real PDF via `file_url` or `file_id`. This affects Phase 2 schema extraction on actual construction documents. Phase 1 text + page classification works fine on the same PDFs.

**Workaround:** Use Gemini fan-out extraction on OCR text output from Phase 1 instead of relying on Tensorlake's structured extraction for now.

## Sources
- [Tensorlake Docs](https://docs.tensorlake.ai/)
- [API Reference](https://docs.tensorlake.ai/api-reference/introduction)
- [Parsing Docs](https://docs.tensorlake.ai/document-ingestion/parsing)
- [Structured Extraction](https://docs.tensorlake.ai/document-ingestion/parsing/structured-extraction)
- [Benchmarks Blog](https://www.tensorlake.ai/blog/benchmarks)
- [Dense Tables Blog](https://www.tensorlake.ai/blog/dense-tables)
- [Gemini 3 Integration](https://www.tensorlake.ai/blog/gemini-3-available)
- [Gemini 3 Quick Findings](https://www.tensorlake.ai/blog/gemini-3-quick-findings)
- [Page Classification](https://www.tensorlake.ai/blog/announcing-page-classifications)
- [Pattern Partitioning](https://www.tensorlake.ai/blog/pattern-based-partitioning)
- [Pricing](https://www.tensorlake.ai/pricing)
- [Webhooks](https://docs.tensorlake.ai/webhooks/overview)
- [Python SDK (PyPI)](https://pypi.org/project/tensorlake/)
- [GitHub](https://github.com/tensorlakeai/tensorlake)
- [HN Discussion](https://news.ycombinator.com/item?id=45839148)
- [Research: ExtractBench](https://arxiv.org/abs/2602.12247)
- [Research: OmniDocBench](https://arxiv.org/abs/2412.07626)
