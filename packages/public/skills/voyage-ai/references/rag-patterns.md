# RAG Production Patterns with Voyage AI

Best practices for building production retrieval-augmented generation systems using Voyage embeddings and rerankers.

## Table of Contents

1. [Multi-Stage Retrieval Pipeline](#multi-stage-retrieval-pipeline)
2. [Chunking Strategies](#chunking-strategies)
3. [pgvector + Supabase Integration](#pgvector--supabase-integration)
4. [Corpus Indexing Patterns](#corpus-indexing-patterns)
5. [Trust-Tiered Knowledge Packets](#trust-tiered-knowledge-packets)
6. [Shadow Evaluation](#shadow-evaluation)
7. [Common Failure Patterns](#common-failure-patterns)

---

## Multi-Stage Retrieval Pipeline

The highest-quality RAG systems use a cascade of narrowing stages. Each stage is cheap and fast, filtering candidates for the more expensive next stage.

### Stage 1: Exact Resolver

Deterministic lookups for known identifiers. Zero latency, perfect precision.

```
Input: "EA103 requirements"
→ Exact match on credit_code = 'EA103'
→ Returns all chunks for that credit
```

Resolve: IDs, codes, aliases, version strings, standard references. Use SQL equality or `IN` clauses. This stage catches ~30-50% of domain-expert queries that reference specific entities.

### Stage 2: Lexical Candidates

Keyword and trigram search for queries with specific terms that vector search might miss.

```sql
-- pg_trgm trigram search
SELECT * FROM kb_chunks
WHERE search_text % $query  -- trigram similarity
ORDER BY similarity(search_text, $query) DESC
LIMIT 30;
```

Why not skip to vectors? Because "ASHRAE 90.1-2010 Appendix G" is a precise string that lexical search handles perfectly but vector search might rank below semantically similar but wrong results.

**Recommended:** `pg_trgm` for v1 (simpler, Supabase-native). Full-text search (`tsvector`) for v2 if needed.

### Stage 3: Semantic Candidates

Vector similarity search using Voyage embeddings + pgvector.

```sql
-- pgvector cosine similarity
SELECT *, 1 - (embedding <=> $query_embedding) AS similarity
FROM kb_chunks
WHERE version = $version
ORDER BY embedding <=> $query_embedding
LIMIT 30;
```

This catches queries where the user describes a concept without using the exact term ("how do I reduce energy use in my building?" → EA Optimize Energy Performance).

### Stage 4: Rerank

Send the union of stages 1-3 candidates (typically 20-50) through the Voyage reranker.

```typescript
const candidates = [...exactHits, ...lexicalHits, ...semanticHits]
const unique = deduplicateByChunkId(candidates)

const { results } = await voyageRerank({
  model: 'rerank-2.5-lite',  // or rerank-2.5 for deep analysis
  query: userQuery,
  documents: unique.map(c => c.content),
  top_k: 8,
})
```

The reranker jointly processes each query-document pair with a cross-encoder — far more accurate than embedding cosine similarity. This is the single highest-ROI step.

### Stage 5: Assemble

Format reranked results into a structured packet preserving metadata the LLM needs: source family, trust tier, dates, URLs.

---

## Chunking Strategies

### For `voyage-context-3` (contextualized embeddings)

**Don't overlap chunks.** The model handles context natively — overlapping creates redundancy without benefit.

**Split on meaning, not character counts:**
- Section headings / H2 boundaries
- Logical topic shifts
- Table boundaries (keep tables whole when possible)
- Paragraph groups that form a complete thought

**Group by source document:**
```
inputs: [
  // All chunks from Credit EA103 Reference Guide page
  ["EA103 Intent...", "EA103 Requirements...", "EA103 Calculations...", "EA103 Documentation..."],
  // All chunks from Credit WE102 Reference Guide page
  ["WE102 Intent...", "WE102 Requirements...", "WE102 Strategies..."],
]
```

**Target chunk size:** 256-512 tokens. Voyage-context-3 is less sensitive to chunk size than standard embeddings (only 2% variance vs 4% for standard models), but 256-512 remains the sweet spot.

### For standard embeddings

**Use 10-20% overlap** to capture information at chunk boundaries.

**Parent-child pattern:** Embed child chunks (small, precise) but return parent chunks (larger, more context) to the LLM. Store `parent_chunk_id` as metadata.

---

## pgvector + Supabase Integration

### Schema pattern

```sql
CREATE TABLE kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  kb_family text NOT NULL,        -- 'reference_guide', 'implementation_approved', etc.
  version text NOT NULL,
  credit_codes text[] DEFAULT '{}',
  category_codes text[] DEFAULT '{}',

  -- Content
  title text NOT NULL,
  content text NOT NULL,
  search_text text NOT NULL,      -- denormalized for trigram search
  token_count integer NOT NULL,

  -- Provenance
  source_url text,
  source_authority text,          -- 'canonical', 'supplemental'
  entry_type text,
  published_at timestamptz,

  -- Vector
  embedding vector(1024) NOT NULL,

  -- Operational
  batch_id uuid,
  created_at timestamptz DEFAULT now()
);
```

### Indexes

```sql
-- Pre-filter by version (most queries are version-scoped)
CREATE INDEX idx_kb_version ON kb_chunks (version);
CREATE INDEX idx_kb_version_family ON kb_chunks (version, kb_family);

-- Trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_kb_search_trgm ON kb_chunks USING gin (search_text gin_trgm_ops);

-- Vector search (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_kb_embedding ON kb_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);
-- m=16 good for <10K chunks; increase to 32+ for larger corpora
-- ef_construction=128 gives better recall than 64 at small build-time cost
```

### RPC pattern

```sql
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(1024),
  match_version text,
  match_families text[] DEFAULT NULL,
  match_count integer DEFAULT 20,
  match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid, kb_family text, title text, content text,
  credit_codes text[], source_url text, token_count integer,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT id, kb_family, title, content, credit_codes,
         source_url, token_count,
         1 - (embedding <=> query_embedding) AS similarity
  FROM kb_chunks
  WHERE version = match_version
    AND (match_families IS NULL OR kb_family = ANY(match_families))
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## Corpus Indexing Patterns

### Batch-swap indexing

Never delete-then-insert. Use atomic batch swaps to avoid downtime:

```sql
-- 1. Load new chunks with a batch_id
INSERT INTO kb_chunks (batch_id, ...) VALUES ($batch_id, ...);

-- 2. Validate counts
SELECT count(*) FROM kb_chunks WHERE batch_id = $new_batch;

-- 3. Atomic swap: delete old, keep new
DELETE FROM kb_chunks
WHERE version = $version
  AND kb_family = $family
  AND (batch_id IS NULL OR batch_id != $new_batch);

-- 4. Clear batch_id marker
UPDATE kb_chunks SET batch_id = NULL WHERE batch_id = $new_batch;
```

### Embedding with Voyage

```typescript
// Group chunks by source document for contextualized embedding
const groups = groupChunksByDocument(allChunks)

// Batch embed (respect 120K token limit per request)
for (const batch of splitIntoBatches(groups, 100_000)) {
  const response = await fetch('https://api.voyageai.com/v1/contextualizedembeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'voyage-context-3',
      inputs: batch.map(g => g.chunks.map(c => c.content)),
      input_type: 'document',
      output_dimension: 1024,
      output_dtype: 'float',
    }),
  })
  // Map embeddings back to chunks
}
```

### Cost estimation

For a corpus of ~3,000 chunks averaging 400 tokens each:
- Total tokens: ~1.2M
- Embedding cost: 1.2M * $0.18/M = ~$0.22
- With batch discount (33% off): ~$0.15
- Re-indexing monthly: ~$1.80/year

---

## Trust-Tiered Knowledge Packets

For domains with multiple knowledge authorities (e.g., standards + interpretations + operational guidance), structure retrieval output as a typed packet — never a flat list.

```typescript
interface KnowledgePacket {
  core_standard: RetrievedChunk[]
  implementation_approved: RetrievedChunk[]
  implementation_provisional: RetrievedChunk[]
  implementation_system_level: RetrievedChunk[]
  general_program: RetrievedChunk[]
}
```

### Prompt injection order

Always inject in priority order:
1. Core standard rules first (primary authority)
2. Approved implementation guidance (supplements core)
3. Provisional guidance (caveated — may change)
4. System-level guidance (process context, not rules)
5. General program facts (operational, time-sensitive)

The LLM should see the highest-authority content first in its context window.

### Labeling in prompts

```
## Core Standard
[content]

## Approved Implementation Guidance
[content]

## Provisional Guidance (Under Review — May Change)
> This guidance is official but under review. Always note this when citing.
[content]
```

---

## Shadow Evaluation

Before cutting over from a legacy retrieval system, run both paths in parallel and compare:

### Shadow logging fields

```json
{
  "query": "user query",
  "exact_hits": 3,
  "lexical_hits": 12,
  "semantic_hits": 20,
  "rerank_model": "rerank-2.5-lite",
  "rerank_latency_ms": 180,
  "total_latency_ms": 420,
  "top_families": ["reference_guide", "implementation_approved"],
  "legacy_top_families": ["reference_guide"],
  "packet_sizes": { "core": 3, "impl_approved": 2, "general": 1 }
}
```

### Golden query set

Test with a frozen set covering:
- Exact ID lookups (credit codes, standard references)
- Semantic concept queries (described in natural language)
- Date-dependent applicability questions
- Process/operational questions
- Ambiguous queries that should preserve trust lanes
- Cross-reference queries (one credit pointing to another)

### Acceptance criteria

- Exact identifiers reliably outrank fuzzy semantic neighbors
- Trust tiers are preserved in output (no lane blurring)
- Provisional guidance always labeled
- Retrieval latency within budget for interactive flows (<500ms)
- No regression in answer quality vs. legacy path

---

## Common Failure Patterns

| Pattern | Symptom | Fix |
|---------|---------|-----|
| **Missing exact match** | Vector returns semantic neighbor instead of exact credit | Add lexical/exact stage before vector search |
| **Context loss** | Chunk about "42.3 kBtu" returns for wrong building | Use `voyage-context-3` with document grouping |
| **Stale embeddings** | New content not findable | Re-embed on content update with batch-swap |
| **Over-retrieval** | Too many chunks, LLM confused | Reduce `top_k`, add reranker to filter |
| **Trust blurring** | Provisional guidance cited as fact | Preserve trust tiers in packet, label in prompt |
| **Latency spike** | Rerank too slow for chat | Use `rerank-2.5-lite`, limit to ~200K total tokens |
| **Dimension mismatch** | Query vs document embedding sizes differ | Always use same `output_dimension` for both |
