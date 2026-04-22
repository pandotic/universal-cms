---
name: marketing-long-form-writer
description: |
  Draft a 1,500–3,000-word blog post grounded in a property's brand voice, SEO keyword,
  and playbook. Submits the draft to `hub_content_pipeline` in `qa_review` state and
  creates a pending `hub_content_qa_reviews` row pointing at the Skeptical Reviewer.
  Use when asked to "write a blog", "draft a post", "long-form content", "write a
  longform", or invoked via `/write-longform {slug} --topic "…" --keyword "…"`.
  Takes three inputs: property slug, topic, target keyword. Refuses politely when no
  brand voice brief exists (quality floor).
user-invocable: true
---

# Marketing Long-Form Writer

Third of the Phase 3 marketing skills. Claude runs this to draft the blog post that the
Skeptical Reviewer will gate next. See `MARKETING_OPS_PHASE_3_PLAN.md` § 5.4 for the
full slice and `Skill Onboarding/marketing-ops-master-spec.md` § 5 for the content
department's mandate.

> **This skill is self-contained.** All logic is below; the only external dependency is
> the `long-form-writer-helper` script in `packages/fleet-dashboard/scripts/skill-helpers/`.

---

## How this works

You are Claude running inside the user's Claude Code session. Two halves:

| Half | Who does it | What it does |
|---|---|---|
| **Read context** | A TypeScript helper script (`long-form-writer-helper --read <slug>`) | Fetches the property, brand voice brief, brand assets, and playbook. Returns JSON. Enforces kill_switch + business_stage + voice-brief-required gates. |
| **Draft + submit** | You (Claude), in this session | Synthesize the blog post (title, excerpt, body markdown, metadata) grounded in the voice + assets + playbook. Write to `/tmp/longform-<slug>-<timestamp>.json` and invoke `long-form-writer-helper --write <slug> --payload <file>` which submits to the content pipeline AND opens a QA review row. |

You do not call any external LLM API. The drafting happens inside your own conversation.

### Invocation

The user invokes this skill by saying any of:
- `/write-longform speed --topic "AI for K-12 reading curricula" --keyword "ASU GSV 2026"`
- "Draft a long-form post for SafeMama about air quality monitoring"
- "Write a blog for pandotic on multi-tenant Supabase"

If the user omitted topic or keyword, ask once. Don't guess:
- **Topic** — concrete subject of the post
- **Target keyword** — primary SEO keyword to rank for

### Inputs and outputs

| In | Out |
|---|---|
| Property slug | Row in `hub_content_pipeline` (channel=blog, status=qa_review) |
| Topic (natural language) | Row in `hub_content_qa_reviews` (pending, reviewer_agent=marketing-skeptical-reviewer) |
| Target keyword | Printed summary + pipeline id for chaining to `/skeptical-review` |

### Phased execution

Run these phases in order. Between phases, give the user a 1–2 sentence status update.

#### Phase 0 — Orient

Tell the user the topic + keyword you're about to write for, then read the context:

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/long-form-writer-helper.ts --read <slug>
```

The script prints a JSON blob with these top-level keys:

```json
{
  "property":     { "id": "…", "name": "…", "slug": "…", "url": "…",
                    "relationship_type": "…", "site_profile": "…",
                    "business_stage": "active", "business_category": "…",
                    "kill_switch": false, "domains": ["…"] },
  "brand_voice":  { "voice_attributes": […], "tone_variations": {…},
                    "vocabulary": […], "anti_examples": […],
                    "example_posts": […], "dos": […], "donts": […],
                    "humor_guidelines": "…", "audience": "…" },
  "brand_assets": { "keywords": […], "description_250": "…", … or null },
  "playbook":     { "type": "…", "brandIsolation": false,
                    "crossPromotion": true, "contentTypes": ["blog", …] },
  "gate":         { "allowed": true } or { "allowed": false, "reason": "…" }
}
```

**Hard gates — stop immediately and do not write:**
- `gate.allowed === false` — echo the reason to the user and stop.
- `brand_voice === null` — echo: "No brand voice brief exists for this property. Quality floor: refusing to draft without one. Create a brief in the Marketing Ops dashboard (`/marketing-ops/brands/<slug>` → Voice tab), then re-run." Stop.
- `playbook.contentTypes` does not include `"blog"` — echo: "Playbook `<type>` does not enable blog content. Use a different channel skill or change the property's relationship_type." Stop.

**Advisory gates — warn but proceed:**
- `brand_assets === null` — you will write without keyword context from `brand_assets.keywords`. Mention this in Phase 4 summary.

#### Phase 1 — Plan the post (internal)

In a scratchpad reply to yourself, decide:

1. **Thesis** — one sentence. The post's core argument.
2. **Target reader** — who exactly is reading this? Pull from `brand_voice.audience`.
3. **Outline** — 4–7 H2 sections. Each with a one-line intent.
4. **Primary keyword placement** — title + first 150 words + one H2 + conclusion.
5. **Secondary keywords** — up to 3 from `brand_assets.keywords`.
6. **CTA** — single, concrete. Where it goes (end of post, not mid-flow).

Do not show this to the user. It's just framing for your own generation.

#### Phase 2 — Draft the post

Write the full post now. Target: 1,500–3,000 words. Format: GitHub-flavored markdown.

**Structure:**
- Opening (150 words max): state the thesis, tell the reader what they'll get, use the keyword once.
- Body: one section per H2. Each section 200–400 words. Use H3s where they help.
- Insight density: at least one non-obvious claim, framework, or data point per H2.
- Conclusion (150 words max): restate thesis, single CTA.

**Apply brand voice precisely:**
- Match `brand_voice.voice_attributes` (e.g. `["direct", "specific", "no-bs"]`).
- Use `brand_voice.vocabulary` preferred terms; avoid `anti_examples`.
- Honor `brand_voice.dos` / `donts` literally.
- If `brand_voice.humor_guidelines` is non-empty, use sparingly.
- Consult `brand_voice.example_posts` for pacing and voice reference.

**Apply playbook:**
- `playbook.brandIsolation === true` → zero mentions of sibling Pandotic brands. No "powered by Pandotic".
- `playbook.crossPromotion === true` → at most one subtle cross-link to a sibling brand where genuinely relevant.

**Forbidden AI tells (anticipate the Skeptical Reviewer):**
- "In today's fast-paced world", "Let's dive in", "In this digital age"
- "The power of X", "Unlock the potential", "It's important to note"
- "In conclusion,", "At the end of the day", "Navigating the complexities"
- Em-dash density > 1 per 100 words
- "Not just X but Y" constructions

**SEO:**
- Primary keyword in: title, meta description (excerpt), first paragraph, one H2, conclusion.
- Secondary keywords woven in naturally (no stuffing).

#### Phase 3 — Write payload

Assemble the payload JSON:

```json
{
  "title":   "…",
  "excerpt": "… 150-char meta description, contains primary keyword …",
  "body":    "<full markdown, 1500–3000 words>",
  "metadata": {
    "brief":                   "One-sentence thesis",
    "target_keyword":          "<primary keyword>",
    "secondary_keywords":      ["…", "…"],
    "estimated_read_time_min": 8
  }
}
```

Write to `/tmp/longform-<slug>-<timestamp>.json`. Then invoke:

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/long-form-writer-helper.ts --write <slug> --payload /tmp/longform-<slug>-<timestamp>.json
```

The helper does two things atomically:

1. `submitToContentPipeline` — inserts `hub_content_pipeline` row with `channel="blog"`, `content_type="blog"`, `status="qa_review"`, `drafted_by_agent="marketing-long-form-writer"`.
2. `requestQAReview` — inserts pending `hub_content_qa_reviews` row with `reviewer_agent="marketing-skeptical-reviewer"`.

Returns `{ ok: true, pipeline_id: "…", qa_review_id: "…", property_id: "…" }`.

#### Phase 4 — Summary

Echo to the user:

- Title + word count
- Primary + secondary keywords
- Thesis (one sentence)
- Pipeline id
- **Next step literally**: "Run `/skeptical-review <pipeline_id>` next to QA the draft."
- If `brand_assets` was null, mention that SEO context was limited.

Done. Total run time target: under 8 minutes (most of it is drafting).

---

## Edge cases

- **Slug not found** — helper exits with `{ "error": "…" }`. Tell the user and stop.
- **kill_switch = true** or **business_stage ≠ active** — `gate.allowed = false`. Refuse.
- **No brand_voice brief** — refuse. Quality floor; there's no point drafting without voice. Tell the user to seed a brief first.
- **No brand_assets** — warn but proceed. Skip Phase 1 step 5 (secondary keywords from assets); use topic-inferred secondaries.
- **Playbook forbids blog channel** — refuse. `pandotic_client` only allows `case_study` + `press`; point the user at the right skill.
- **Topic too vague** ("write about AI") — push back. Ask for a concrete angle before proceeding. Don't just generate filler.
- **Keyword already dominated** — not your problem. You draft; SEO analysis is a different skill.
- **User asks for a specific length outside 1,500–3,000** — honor it, but warn that very short (<1,000) posts rarely rank and very long (>3,500) hit attention cliffs.

---

## Non-goals

- **Publishing** — you only write to `hub_content_pipeline`. Pushing to a CMS (Ghost, WordPress, Sanity, etc.) is a different skill.
- **SEO research** — you consume `brand_assets.keywords`; you do not call Ahrefs / SEMrush / search APIs.
- **Image generation** — graphics are the Graphics Orchestrator's job (future phase). If the post benefits from an image, note that in `metadata.brief` for downstream skills.
- **QA** — the Skeptical Reviewer does the gate. Your end-state is a `qa_review` row + a pending QA review pointing at the reviewer.
- **Short-form content** — social posts, email copy, newsletters, pitches belong to other skills. If the user asks for those, redirect.

---

## Debugging

If the write fails:

1. Verify env: `echo $SUPABASE_URL && echo $SUPABASE_SERVICE_ROLE_KEY | wc -c` (should be > 100).
2. Re-run the read to confirm the property still exists and is active.
3. Confirm the voice brief exists: `SELECT id FROM hub_brand_voice_briefs WHERE property_id = '<id>'`.
4. Check migration 00112 has been applied: `hub_content_pipeline` should have columns `drafted_by_agent`, `qa_confidence`, `source_content_id`.
5. If the helper throws on JSON parse, your payload file has a syntax error: `cat /tmp/longform-<slug>-<timestamp>.json | jq .` to find it.
6. If the QA review row wasn't inserted but the pipeline row was, re-run just the QA insert via psql or delete the pipeline row and re-run the whole write. The helper is not transactional across the two inserts yet.
