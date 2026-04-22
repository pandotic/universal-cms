---
name: marketing-skeptical-reviewer
description: |
  QA gate for every piece of content Claude drafts through the Pandotic marketing pipeline.
  Review a single `hub_content_pipeline` row against brand voice, factual claims, AI tells,
  hallucination risk, CTA clarity, grammar, and per-content-type rules. Write the verdict to
  `hub_content_qa_reviews` with a structured checks payload, overall confidence, and suggested
  fixes, then flip the pipeline row to `approved` (auto-pilot) or `needs_human_review`
  (default). Use when asked to "review", "QA", "skeptical review", "gate", "check", or
  "flag" a pipeline item, or when invoked via `/skeptical-review {id}`. Takes a single input:
  the pipeline item id (a UUID).
user-invocable: true
---

# Marketing Skeptical Reviewer

Second of the Phase 3 marketing skills. Claude runs this against any piece of content that
the Long-Form Writer, Repurposing Specialist, or another drafting skill has produced.
Writes a row to `hub_content_qa_reviews` and transitions the pipeline row to
`approved` or `needs_human_review` based on auto-pilot settings + confidence threshold.
See `MARKETING_OPS_PHASE_3_PLAN.md` § 5.2 and `Skill Onboarding/marketing-ops-master-spec.md`
§ 7 for the full spec.

> **This skill is self-contained.** All logic is below; the only external dependency is
> the `skeptical-reviewer-helper` script in `packages/fleet-dashboard/scripts/skill-helpers/`.

---

## How this works

You are Claude running inside the user's Claude Code session. Two halves:

| Half | Who does it | What it does |
|---|---|---|
| **Read context** | A TypeScript helper script (`skeptical-reviewer-helper --read <id>`) | Fetches the pipeline row, property, matching brand voice brief, recent QA learnings (top 50), auto-pilot setting for this `(property_id, content_type)`, and prior QA reviews for the same pipeline item. Returns JSON. Enforces kill_switch + business_stage gates. |
| **Review + write** | You (Claude), in this session | Run the review checks, assemble the structured payload, write to `/tmp/qa-review-<id>.json`, then invoke `skeptical-reviewer-helper --write <id> --payload <file>` to insert the review row and transition the pipeline status. |

You do not call any external LLM API. The review happens inside your own conversation.

### Invocation

The user invokes this skill by saying any of:
- `/skeptical-review 01HXYZ1234…`
- "Review the latest draft for speed"
- "QA pipeline item abc123"
- "Gate the blog post that just came out of the long-form writer"

If the user gave a slug instead of a UUID, ask for the pipeline id. If they gave a
property slug and said "latest", read the most recent `qa_review` row for that property
from the Marketing Ops dashboard (`/marketing-ops/pipeline`). Don't guess.

### Inputs and outputs

| In | Out |
|---|---|
| Pipeline item id (UUID) | Row in `hub_content_qa_reviews` with structured checks + confidence |
|  | `hub_content_pipeline.status` flipped to `approved` or `needs_human_review` |
|  | Printed summary of the verdict |

### Phased execution

Run these phases in order. Between phases, give the user a 1–2 sentence status update.

#### Phase 0 — Orient

Tell the user what you're about to do (2–3 sentences) and read the context.

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/skeptical-reviewer-helper.ts --read <id>
```

The script prints a JSON blob with these top-level keys:

```json
{
  "pipeline_item":      { "id": "…", "property_id": "…", "channel": "blog", "content_type": "blog",
                          "platform": null, "title": "…", "body": "…", "status": "qa_review",
                          "drafted_by_agent": "marketing-long-form-writer",
                          "qa_confidence": null, "metadata": { … } },
  "property":           { "id": "…", "name": "…", "slug": "…", "relationship_type": "…",
                          "site_profile": "…", "business_stage": "active", "kill_switch": false },
  "brand_voice":        { … or null if no brief exists for this property },
  "recent_learnings":   [ { "check_type": "ai_tells", "outcome": "human_overrode", "human_feedback": "…" }, … ],
  "auto_pilot_setting": { "auto_pilot_enabled": false, "confidence_threshold": 0.85, "trust_score": 0.5 },
  "existing_reviews":   [ … prior review rows for the same pipeline item, newest first, or [] ],
  "gate":               { "allowed": true } or { "allowed": false, "reason": "…" }
}
```

**If `gate.allowed === false`, stop.** Tell the user the reason and do not write any review.

**If `brand_voice` is null**, warn the user — you will still run the universal checks but
the brand voice check will be scored as `N/A`, not `passed`. Ask if they want to proceed
or stop so they can seed a voice brief first.

**If `pipeline_item.status !== "qa_review"`**, warn the user that the item is not in
`qa_review` state (e.g. already `approved`, already `needs_human_review`). Offer to
re-review anyway (useful when the human requested a revision) or stop.

**If `existing_reviews.length > 0`**, mention how many prior reviews exist and summarize
their verdicts. This run will append a new review row; the pipeline status transition
reflects this latest review.

#### Phase 1 — Run the checks

You are performing all of these against `pipeline_item.body` (and `title` where
relevant). Use `brand_voice`, `property.relationship_type`, and `recent_learnings` to
calibrate. The output is a single JSON object.

**Universal checks (all content types):**

| Check | How to score |
|---|---|
| `factual` | Identify any hard claims (numbers, names, dates, citations). Mark unverified claims in `notes`. `passed` if no unverified hard claims; otherwise flag. |
| `hallucination_risk` | Scan for plausible-sounding but unverifiable claims. List flagged phrases. `passed` if empty. |
| `brand_voice` | Compare tone, vocabulary, and anti-examples in `brand_voice.tone` / `dos` / `donts`. Score 0.0–1.0 in `score`. `passed` if score ≥ 0.75. If `brand_voice` is null, return `{ "score": null, "notes": "no brief" }`. |
| `ai_tells` | Flag clichés from this hard-coded list (and any similar patterns you spot): "in today's fast-paced world", "let's dive in", "in this digital age", "the power of", "unlock the potential", "it's important to note", "in conclusion,", "at the end of the day", em-dash density > 1 per 100 words, "not just X but Y" constructions, "navigating the complexities". `passed` if empty list. |
| `cta_clarity` | For content types where a CTA is expected (blog, email, landing_page, featured_pitch, newsletter), identify the primary CTA. `passed` if exactly one clear CTA exists. |
| `grammar` | Basic grammar/spelling. `passed` if no issues. List issues in `issues` array. |

**Per-content-type checks:**

- `blog` (channel=`blog`, content_type=`blog`):
  - `thesis` — does the first 200 words state a clear thesis? `passed`/`failed`.
  - `structure` — headings present (H2 minimum) and logically ordered? `passed`/`failed`.
  - `insight` — at least one non-obvious insight or framework? `passed`/`failed`.
- `social` (channel=`social`, any platform):
  - `char_limit` — within platform max (Twitter=280, LinkedIn=3000, Instagram=2200, Facebook=63206). `passed`/`failed` + `length`.
  - `hook` — first 12 words stop the scroll? `passed`/`failed`.
  - `hashtags` — ≤ 5 hashtags for Twitter/LinkedIn, ≤ 10 for Instagram. `passed`/`failed`.
- `press` (channel=`press`, content_type=`press`):
  - `ap_style` — date format, numerals, titles follow AP style. `passed`/`failed`.
  - `dateline` — present (CITY, State — Month Day, Year —)? `passed`/`failed`.
  - `five_ws` — who/what/when/where/why in first 3 paragraphs? `passed`/`failed`.
  - `boilerplate` — "About {brand}" block present at the end? `passed`/`failed`.
- `email` (channel=`email`):
  - `subject_specificity` — subject ≥ 30 chars and non-generic? `passed`/`failed`.
  - `single_cta` — exactly one CTA? `passed`/`failed`.
  - `unsub_disclaimer` — unsubscribe / footer block present? `passed`/`failed`.
- `featured_pitch` (channel=`featured_pitch`):
  - `hook_answer` — does the first sentence answer the question posed? `passed`/`failed`.
  - `quotable_insight` — at least one pull-quote-worthy sentence? `passed`/`failed`.

#### Phase 2 — Assemble the payload

Output the full payload as a single JSON object matching this schema exactly:

```json
{
  "overall_confidence": 0.82,
  "status": "flagged",
  "checks": {
    "factual":            { "passed": true,  "notes": "…" },
    "hallucination_risk": { "passed": true,  "flagged_phrases": [] },
    "brand_voice":        { "score": 0.85, "violations": [] },
    "ai_tells":           { "passed": false, "phrases": ["in today's fast-paced world"] },
    "cta_clarity":        { "passed": true },
    "grammar":            { "passed": true, "issues": [] },
    "thesis":             { "passed": true },
    "structure":          { "passed": true },
    "insight":            { "passed": true }
  },
  "suggested_fixes": [
    "Replace 'let's dive in' with 'Here's the short version.'",
    "Cut em-dashes — you have 5 in a 600-word post."
  ]
}
```

**How to score `overall_confidence`:**

1. Start at 1.0.
2. Subtract 0.15 per universal check that is `failed` (factual, hallucination_risk, ai_tells, cta_clarity, grammar).
3. Subtract `(1.0 - brand_voice.score) * 0.30` if `brand_voice.score !== null`.
4. Subtract 0.10 per content-type check that is `failed`.
5. Floor at 0.0; cap at 1.0.

**How to set `status`:**

- `passed` — overall_confidence ≥ 0.90 AND no failed checks.
- `flagged` — 0.50 ≤ overall_confidence < 0.90 OR 1–2 failed checks.
- `failed` — overall_confidence < 0.50 OR ≥ 3 failed checks OR any hallucination flag.

**Suggested fixes:** keep under 10. Each should be actionable, one line, and reference the
exact phrase / line / section to change.

#### Phase 3 — Write payload

Write the payload to `/tmp/qa-review-<id>.json`. Then invoke:

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/skeptical-reviewer-helper.ts --write <id> --payload /tmp/qa-review-<id>.json
```

The helper does three things atomically:

1. Inserts a row into `hub_content_qa_reviews` with your payload.
2. Updates `hub_content_pipeline.qa_confidence` to match `overall_confidence`.
3. Transitions `hub_content_pipeline.status`:
   - → `approved` if `overall_confidence ≥ auto_pilot_setting.confidence_threshold` AND `auto_pilot_setting.auto_pilot_enabled === true`.
   - → `needs_human_review` otherwise.

Returns `{ ok: true, review_id: "…", pipeline_status: "needs_human_review" | "approved", pipeline_id: "…" }`.

#### Phase 4 — Summary

Echo to the user:

- Pipeline item id + title
- Verdict: `passed` / `flagged` / `failed`
- Overall confidence (e.g. `0.82`)
- Top 3 `suggested_fixes` (if any)
- New pipeline status (`approved` or `needs_human_review`) and why (auto-pilot threshold hit or not)
- Next step:
  - If `approved` — "Item is queued for publishing; no further human action needed."
  - If `needs_human_review` — "Visit http://localhost:3001/marketing-ops/pipeline/<id> to approve or request revision."

Done. Total run time target: under 2 minutes.

---

## Edge cases

- **Pipeline id not found** — helper exits with `{ "error": "…" }`. Tell the user and stop.
- **kill_switch = true** or **business_stage ≠ active** — `gate.allowed = false`. Refuse.
- **No brand_voice brief** — universal checks still run; brand_voice check is `{ "score": null, "notes": "no brief" }` and does NOT subtract from `overall_confidence` in Phase 2 step 3. Warn the user in Phase 0 and in the Phase 4 summary.
- **Pipeline status already terminal** (`published`, `archived`) — warn and ask if they want to re-review (no status transition will happen — the helper only transitions from `qa_review` / `needs_human_review` / `revision_requested`).
- **Auto-pilot off for this content type** (default) — always route to `needs_human_review`, regardless of confidence.
- **No `content_type`** — pipeline items without a `content_type` get universal checks only; skip the per-content-type block.
- **Very short content** (body < 100 chars) — skip `structure`, `insight`, `thesis`; score them as `N/A` (not `passed`, not `failed`).

---

## Non-goals

- **Rewriting the content** — you flag issues; you do not edit `pipeline_item.body`. The human (or a future rewrite skill) does that.
- **Re-running the draft** — you do not trigger the drafting skill. A `failed` verdict just flips status; the human re-triggers the writer if they want a rewrite.
- **Publishing** — even on `approved`, this skill does not push to external platforms.
- **Cross-item review** — one pipeline id per run. Reviewing a batch is `/skeptical-review` called N times.

---

## Debugging

If the write fails:

1. Verify env: `echo $SUPABASE_URL && echo $SUPABASE_SERVICE_ROLE_KEY | wc -c` (should be > 100).
2. Re-run the read to confirm the pipeline row still exists and is in a reviewable state.
3. Confirm `hub_content_qa_reviews` exists: `SELECT column_name FROM information_schema.columns WHERE table_name='hub_content_qa_reviews'` should return 11 columns.
4. If the helper throws on JSON parse, your payload file has a syntax error: `cat /tmp/qa-review-<id>.json | jq .` to find it.
5. If the pipeline status didn't transition, check `auto_pilot_setting` — SPEED stays `auto_pilot_enabled=false` through Phase 3, so everything routes to `needs_human_review` by design.
