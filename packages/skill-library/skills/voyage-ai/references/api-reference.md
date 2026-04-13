# Voyage AI API Reference

Complete API specifications for embeddings, contextualized embeddings, and rerankers.

## Table of Contents

1. [Contextualized Chunk Embeddings](#contextualized-chunk-embeddings)
2. [Standard Text Embeddings](#standard-text-embeddings)
3. [Rerankers](#rerankers)
4. [Batch Inference](#batch-inference)
5. [Token Limits Summary](#token-limits-summary)
6. [Pricing Summary](#pricing-summary)

---

## Contextualized Chunk Embeddings

**Endpoint:** `POST https://api.voyageai.com/v1/contextualizedembeddings`

### Request

```json
{
  "inputs": [
    ["chunk_1_of_doc_A", "chunk_2_of_doc_A", "chunk_3_of_doc_A"],
    ["chunk_1_of_doc_B", "chunk_2_of_doc_B"]
  ],
  "model": "voyage-context-3",
  "input_type": "document",
  "output_dimension": 1024,
  "output_dtype": "float"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputs` | `List[List[str]]` | Yes | Nested lists — each inner list = one document's chunks in order |
| `model` | `str` | Yes | `voyage-context-3` |
| `input_type` | `str` | No | `null`, `"query"`, or `"document"` — prepends retrieval-optimized prefix |
| `output_dimension` | `int` | No | 256, 512, 1024 (default), or 2048 |
| `output_dtype` | `str` | No | `"float"` (default), `"int8"`, `"uint8"`, `"binary"`, `"ubinary"` |
| `chunk_fn` | `Callable` | No | Custom chunking function (Python SDK only) |

### Limits

| Constraint | Limit |
|-----------|-------|
| Max input groups per request | 1,000 |
| Max total tokens per request | 120,000 |
| Max total chunks per request | 16,000 |
| Model context length | 32,000 tokens |

### Response

```json
{
  "results": [
    {
      "embeddings": [[0.123, -0.456, ...], [0.789, -0.012, ...]],
      "index": 0
    },
    {
      "embeddings": [[0.321, -0.654, ...]],
      "index": 1
    }
  ],
  "total_tokens": 4521
}
```

`results[i].embeddings[j]` corresponds to `inputs[i][j]` — one embedding per chunk, preserving document grouping.

### How contextualization works

Each chunk is encoded with awareness of all other chunks in the same inner list. A revenue figure separated from its company name scores rank 8 with standard embeddings but rank 1 with contextualized embeddings. The model intelligently determines what global context each chunk vector should capture.

### Querying

For queries, use single-element inner lists with `input_type: "query"`:

```json
{
  "inputs": [["What is the company's Q3 revenue?"]],
  "model": "voyage-context-3",
  "input_type": "query",
  "output_dimension": 1024
}
```

Embeddings are compatible across all `input_type` values — you can compare query embeddings against document embeddings.

---

## Standard Text Embeddings

**Endpoint:** `POST https://api.voyageai.com/v1/embeddings`

### Request

```json
{
  "input": ["text to embed", "another text"],
  "model": "voyage-4",
  "input_type": "document",
  "output_dimension": 1024,
  "output_dtype": "float"
}
```

### Models

| Model | Default Dim | Context | Price/M tokens | Notes |
|-------|-------------|---------|---------------|-------|
| `voyage-4-large` | 1024 | 32K | $0.12 | Highest quality general purpose |
| `voyage-4` | 1024 | 32K | $0.06 | Balanced quality/cost |
| `voyage-4-lite` | 512 | 32K | $0.02 | High throughput |
| `voyage-3-large` | 1024 | 32K | $0.12 | Previous gen, still strong |
| `voyage-3.5` | 1024 | 32K | $0.06 | Previous gen balanced |
| `voyage-3.5-lite` | 512 | 32K | $0.02 | Previous gen lite |
| `voyage-code-3` | 1024 | 32K | $0.18 | Code-specialized |
| `voyage-finance-2` | 1024 | 16K | $0.12 | Finance-specialized |
| `voyage-law-2` | 1024 | 16K | $0.12 | Legal-specialized |

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `List[str]` | Yes | Flat list of texts (max 128 items) |
| `model` | `str` | Yes | Model name |
| `input_type` | `str` | No | `"query"`, `"document"`, or `null` |
| `output_dimension` | `int` | No | Supported dimensions vary by model |
| `output_dtype` | `str` | No | `"float"` (default), `"int8"`, `"uint8"`, `"binary"`, `"ubinary"` |
| `truncation` | `bool` | No | Auto-truncate oversized inputs (default true) |

### Limits

| Constraint | Limit |
|-----------|-------|
| Max texts per request | 128 |
| Max total tokens per request | 120,000 |

---

## Rerankers

**Endpoint:** `POST https://api.voyageai.com/v1/rerank`

### Request

```json
{
  "query": "What is ASHRAE 90.1 minimum efficiency?",
  "documents": ["doc 1 text...", "doc 2 text...", "doc 3 text..."],
  "model": "rerank-2.5-lite",
  "top_k": 5,
  "truncation": true
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `str` | Yes | Search query (max 8,000 tokens for 2.5 models) |
| `documents` | `List[str]` | Yes | Candidate documents (max 1,000) |
| `model` | `str` | Yes | `rerank-2.5`, `rerank-2.5-lite`, or older models |
| `top_k` | `int` | No | Return only top K results |
| `truncation` | `bool` | No | Auto-truncate oversized inputs (default true) |

### Response

```json
{
  "results": [
    { "index": 2, "document": "doc 3 text...", "relevance_score": 0.92 },
    { "index": 0, "document": "doc 1 text...", "relevance_score": 0.78 },
    { "index": 1, "document": "doc 2 text...", "relevance_score": 0.31 }
  ],
  "total_tokens": 1523
}
```

Results are sorted by `relevance_score` descending.

### Models

| Model | Context | Max Total Tokens | Price/M tokens | Best for |
|-------|---------|-----------------|---------------|----------|
| `rerank-2.5` | 32K | 600K | $0.05 | Quality-first (analysis, research) |
| `rerank-2.5-lite` | 32K | 600K | $0.02 | Latency-first (chat, interactive) |
| `rerank-2` | 16K | 600K | $0.05 | Previous gen quality |
| `rerank-2-lite` | 8K | 600K | $0.02 | Previous gen lite |

### Token limits

| Constraint | rerank-2.5 / 2.5-lite | rerank-2 | rerank-2-lite |
|-----------|----------------------|----------|--------------|
| Max query tokens | 8,000 | 8,000 | 8,000 |
| Max documents | 1,000 | 1,000 | 1,000 |
| Max query + single doc | 32,000 | 16,000 | 8,000 |
| Max total tokens | 600,000 | 600,000 | 600,000 |

### When to use each reranker

- **`rerank-2.5-lite`**: Interactive flows — chat, advisor, autocomplete. Keep total tokens under ~200K for acceptable latency.
- **`rerank-2.5`**: Deep analysis — report generation, research, batch evaluation. Quality matters more than speed.
- Query can include instructions (e.g., "Find the most relevant LEED credit requirement for...") to steer relevance scoring.

---

## Batch Inference

**33% cost discount** with a 12-hour completion window.

### Supported models

All embedding models (`voyage-context-3`, `voyage-4`, `voyage-4-lite`, etc.) and reranker models (`rerank-2.5`, `rerank-2.5-lite`).

### Workflow

1. Create JSONL input file with `custom_id` + `body` per line
2. Upload via Files API
3. Create batch job specifying model and endpoint
4. Poll for completion
5. Download results (mapped by `custom_id`)

### Limits

| Constraint | Limit |
|-----------|-------|
| Max inputs per batch | 100,000 |
| Max tokens across active batches | 1,000,000,000 |
| Max concurrent batch jobs | 100 |
| Completion window | 12 hours |

### When to use batch

- Full corpus rebuilds / re-indexing
- Large evaluation runs
- Offline rerank experiments
- NOT for interactive runtime traffic

---

## Token Limits Summary

| Model | Per-Request Tokens | Context | Tier 1 TPM | Tier 1 RPM |
|-------|-------------------|---------|-----------|-----------|
| `voyage-context-3` | 120K (total), 16K chunks | 32K | 3M | 2,000 |
| `voyage-4-large` | 120K | 32K | 3M | 2,000 |
| `voyage-4` | 120K | 32K | 8M | 2,000 |
| `voyage-4-lite` | 120K | 32K | 16M | 2,000 |
| `rerank-2.5` | 600K total | 32K | 2M | 2,000 |
| `rerank-2.5-lite` | 600K total | 32K | 4M | 2,000 |

Tiers auto-upgrade: Tier 2 (>$100 paid) = 2x limits, Tier 3 (>$1000 paid) = 3x limits.

---

## Pricing Summary

| Category | Model | Price/M tokens | Free tier |
|----------|-------|---------------|-----------|
| Contextualized | `voyage-context-3` | $0.18 | 200M tokens |
| General | `voyage-4-large` | $0.12 | 200M tokens |
| General | `voyage-4` | $0.06 | 200M tokens |
| General | `voyage-4-lite` | $0.02 | 200M tokens |
| Code | `voyage-code-3` | $0.18 | 200M tokens |
| Reranker | `rerank-2.5` | $0.05 | 200M tokens |
| Reranker | `rerank-2.5-lite` | $0.02 | 200M tokens |
| Batch | All models | 33% off above | — |

Storage (Files API): $0.05/GB/month.
