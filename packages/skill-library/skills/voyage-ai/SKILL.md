---
name: voyage-ai
description: Voyage AI embeddings, contextualized chunk embeddings, and rerankers for RAG systems. Use when building or improving retrieval-augmented generation, semantic search, document retrieval, knowledge base indexing, or reranking pipelines. Triggers on mentions of Voyage AI, voyage-context-3, voyage-4, rerank-2.5, contextualized embeddings, embedding API integration, vector search with reranking, hybrid retrieval (exact + lexical + semantic + rerank), pgvector embedding pipelines, or RAG chunking strategies. Also use when choosing between embedding providers or designing a multi-stage retrieval architecture.
---

# Voyage AI — Embeddings & Rerankers for RAG

Voyage AI provides best-in-class text embeddings and rerankers for retrieval-augmented generation. This skill covers the full API surface, production patterns, and RAG architecture best practices.

## When to read references

- For exact API parameters, token limits, and request/response shapes: read [`references/api-reference.md`](references/api-reference.md)
- For RAG architecture, chunking, hybrid search, and production deployment patterns: read [`references/rag-patterns.md`](references/rag-patterns.md)

## Model selection

Pick the right model for the job:

### Contextualized chunk embeddings (recommended for RAG)

Use **`voyage-context-3`** when your corpus has multi-chunk documents where individual chunks lose meaning without surrounding context. This is the default choice for RAG because it solves the context-loss problem that plagues standard chunk embeddings — each chunk's vector encodes information from sibling chunks in the same document.

- Endpoint: `POST /v1/contextualizedembeddings`
- Context window: 32,000 tokens
- Default dimensions: 1024 (also 256, 512, 2048)
- Pricing: $0.18/M tokens (200M free tokens included)
- Outperforms OpenAI-v3-large by 14%, Cohere-v4 by 8%, and contextual retrieval by 7%

**Key pattern:** Group chunks from the same source document into one inner list. The model sees all chunks together and intelligently determines what global context each chunk vector should encode.

```
// Good: chunks from same document grouped together
inputs: [
  ["Chapter 1 intro...", "Chapter 1 details...", "Chapter 1 summary..."],
  ["Chapter 2 intro...", "Chapter 2 details..."]
]

// Bad: chunks from different documents mixed
inputs: [
  ["Doc A chunk 1", "Doc B chunk 1", "Doc C chunk 1"]
]
```

### Standard embeddings (when context loss isn't a concern)

| Model | Dimensions | Price/M tokens | Best for |
|-------|-----------|---------------|----------|
| `voyage-4-large` | 1024 | $0.12 | Highest quality, general purpose |
| `voyage-4` | 1024 | $0.06 | Balanced quality/cost |
| `voyage-4-lite` | 512 | $0.02 | High throughput, cost-sensitive |

Use standard embeddings (`POST /v1/embeddings`) when chunks are self-contained (e.g., FAQ entries, product descriptions, short standalone paragraphs).

### Rerankers

Rerankers are cross-encoders that jointly process query-document pairs — far more accurate than embedding similarity alone. Apply on top-20-50 candidates from your initial retrieval.

| Model | Context | Price/M tokens | Use when |
|-------|---------|---------------|----------|
| `rerank-2.5` | 32K tokens | $0.05 | Quality matters most (analysis, research) |
| `rerank-2.5-lite` | 32K tokens | $0.02 | Latency matters (chat, autocomplete) |

Endpoint: `POST /v1/rerank`

**Reranking is one of the highest-ROI upgrades in RAG.** A simple rerank step on embedding search results typically improves answer quality more than switching embedding models.

## Retrieval architecture (the right order)

The best RAG systems use a multi-stage pipeline. Each stage narrows candidates with increasing precision:

```
1. Exact resolver     → deterministic lookups (IDs, codes, aliases)
2. Lexical candidates → keyword/trigram search (pg_trgm, BM25)
3. Semantic candidates → vector similarity (pgvector + Voyage embeddings)
4. Rerank             → cross-encoder scoring (Voyage reranker)
5. Assemble           → format results with metadata for the LLM
```

Don't skip stages. Vector search alone misses exact matches. Lexical search alone misses semantic intent. The reranker catches what both miss.

## Quick start pattern (Deno/TypeScript)

```typescript
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')

// Embed documents (contextualized)
const embedResp = await fetch('https://api.voyageai.com/v1/contextualizedembeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VOYAGE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'voyage-context-3',
    inputs: [["chunk1 from doc A", "chunk2 from doc A"]],
    input_type: 'document',
    output_dimension: 1024,
    output_dtype: 'float',
  }),
})

// Embed query
const queryResp = await fetch('https://api.voyageai.com/v1/contextualizedembeddings', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'voyage-context-3',
    inputs: [["user's search query"]],
    input_type: 'query',
    output_dimension: 1024,
    output_dtype: 'float',
  }),
})

// Rerank top candidates
const rerankResp = await fetch('https://api.voyageai.com/v1/rerank', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'rerank-2.5-lite',
    query: "user's search query",
    documents: ["candidate 1 text", "candidate 2 text", "..."],
    top_k: 5,
  }),
})
```

## Rate limits and optimization

### Limits by tier (auto-upgraded based on spend)

| Tier | Qualification | Multiplier |
|------|--------------|-----------|
| Tier 1 | Payment method added | 1x (baseline) |
| Tier 2 | $100+ paid | 2x |
| Tier 3 | $1000+ paid | 3x |

### Baseline Tier 1 limits

| Model | TPM | RPM |
|-------|-----|-----|
| `voyage-context-3` | 3M | 2,000 |
| `voyage-4` | 8M | 2,000 |
| `voyage-4-lite` | 16M | 2,000 |
| `rerank-2.5` | 2M | 2,000 |
| `rerank-2.5-lite` | 4M | 2,000 |

### Optimization strategies

- Batch embedding requests: group 128+ documents per call instead of many small requests
- For corpus rebuilds: use the Batch API (33% discount, 12-hour window)
- Back off on 429 errors with exponential retry
- For interactive flows: keep rerank under ~200K total tokens for acceptable latency

## Dimensions and quantization

Voyage supports flexible output dimensions and quantization for storage/cost optimization:

| Dimension | Use case |
|-----------|---------|
| 2048 | Maximum quality (rarely needed) |
| 1024 | Default — best quality/size tradeoff |
| 512 | Good for large corpora where storage matters |
| 256 | Minimum viable for very large scale |

| Output dtype | Description |
|-------------|-------------|
| `float` | 32-bit, highest accuracy (default) |
| `int8` / `uint8` | 8-bit integer, ~4x smaller |
| `binary` / `ubinary` | 1-bit packed, ~32x smaller |

Start with 1024-dim float. Only reduce dimensions or quantize after measuring that storage/cost pressure justifies the quality tradeoff.

## Batch API

For large corpus indexing or evaluation jobs, use the Batch API for a 33% cost reduction:

- Supported models: all embedding + reranker models
- Format: JSONL input file uploaded via Files API
- Max: 100K inputs per batch, 1B tokens across active batches
- Completion window: 12 hours
- Pay only for successful requests

Use batch mode for corpus rebuilds and large evaluations. Don't use it for interactive runtime traffic.

## Hard rules

- Always set `input_type` — `'document'` for corpus indexing, `'query'` for search queries
- Don't overlap chunks when using `voyage-context-3` — the model handles context natively
- Don't mix documents from different sources in the same inner list for contextualized embeddings
- Keep rerank candidate sets to 20-50 for interactive flows (latency-sensitive)
- Back off on 429 — don't retry immediately
- Re-check official docs before production tuning (limits and models evolve)

## Official docs

- [Contextualized embeddings](https://docs.voyageai.com/docs/contextualized-chunk-embeddings)
- [Standard embeddings](https://docs.voyageai.com/docs/embeddings)
- [Rerankers](https://docs.voyageai.com/docs/reranker)
- [Dimensions & quantization](https://docs.voyageai.com/docs/flexible-dimensions-and-quantization)
- [Rate limits](https://docs.voyageai.com/docs/rate-limits)
- [Batch inference](https://docs.voyageai.com/docs/batch-inference)
- [Pricing](https://docs.voyageai.com/docs/pricing)
