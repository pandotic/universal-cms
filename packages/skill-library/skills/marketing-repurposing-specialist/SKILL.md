---
name: marketing-repurposing-specialist
description: |
  Atomize an approved long-form blog post into 5 platform-rotated social posts, 1
  newsletter excerpt, and 3 quote cards — each a separate `hub_content_pipeline` row
  with `source_content_id` pointing at the blog. Every child opens its own pending
  `hub_content_qa_reviews` row pointing at the Skeptical Reviewer. Use when asked to
  "repurpose", "atomize", "break down the blog", or invoked via `/repurpose {pipeline-id}`.
  Takes a single input: the source pipeline item id (must be `channel=blog` AND
  `status=approved`). Honors playbook gates — skips social when
  `playbook.socialStrategy === "skip"`, skips newsletter when
  `playbook.newsletterEnabled === false`.
user-invocable: true
---

# Marketing Repurposing Specialist

Fourth of the Phase 3 marketing skills. Claude runs this after the Skeptical Reviewer
has approved a long-form post. Fans the post out into 9 downstream content items in one
pass. See `MARKETING_OPS_PHASE_3_PLAN.md` § 5.5 for the full slice.

> **This skill is self-contained.** All logic is below; the only external dependency is
> the `repurposing-helper` script in `packages/fleet-dashboard/scripts/skill-helpers/`.

---

## How this works

You are Claude running inside the user's Claude Code session. Two halves:

| Half | Who does it | What it does |
|---|---|---|
| **Read context** | A TypeScript helper script (`repurposing-helper --read <id>`) | Fetches the source blog post, property, brand voice brief, brand assets, and playbook. Enforces `source.channel === "blog"` AND `source.status === "approved"` plus kill_switch + business_stage gates. Returns JSON. |
| **Atomize + fan out** | You (Claude), in this session | Generate the child set (5 social + 1 newsletter + 3 quote cards), respecting playbook gating rules, then invoke `repurposing-helper --write <id> --payload <file>` which inserts every child pipeline row AND a pending QA review row for each. |

You do not call any external LLM API. The atomization happens inside your own conversation.

### Invocation

The user invokes this skill by saying any of:
- `/repurpose 01HXYZ1234…`
- "Atomize blog abc123"
- "Repurpose that approved post"
- "Break down the long-form for SPEED"

If the user gave a slug instead of a UUID, ask for the pipeline id of the approved blog.
Don't guess.

### Inputs and outputs

| In | Out |
|---|---|
| Source pipeline item id (UUID, blog, approved) | Up to 9 new rows in `hub_content_pipeline`, each `source_content_id = source.id` |
|  | Up to 9 new pending `hub_content_qa_reviews` rows (one per child) |
|  | Printed summary + per-child pipeline ids |

### Phased execution

Run these phases in order. Between phases, give the user a 1–2 sentence status update.

#### Phase 0 — Orient

Tell the user what you're about to do (2–3 sentences) and read the context:

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/repurposing-helper.ts --read <id>
```

The script prints a JSON blob with these top-level keys:

```json
{
  "source_item":  { "id": "…", "property_id": "…", "channel": "blog", "content_type": "blog",
                    "title": "…", "body": "<markdown>", "excerpt": "…", "status": "approved",
                    "metadata": { "target_keyword": "…", … }, "created_at": "…" },
  "property":     { "id": "…", "name": "…", "slug": "…", "relationship_type": "…",
                    "site_profile": "…", "business_stage": "active", "kill_switch": false,
                    "domains": ["…"] },
  "brand_voice":  { "voice_attributes": […], "tone_variations": {…}, "vocabulary": […],
                    "anti_examples": […], "dos": […], "donts": […],
                    "humor_guidelines": "…", "audience": "…" },
  "brand_assets": { "hashtags": {"twitter": […], "instagram": […], "linkedin": […]}, … or null },
  "playbook":     { "type": "…", "socialStrategy": "own_handles",
                    "newsletterEnabled": true, "brandIsolation": false,
                    "crossPromotion": true, "contentTypes": [...] },
  "gate":         { "allowed": true, "produce_social": true, "produce_newsletter": true }
                  or { "allowed": false, "reason": "…" }
}
```

**Hard gates — stop immediately:**
- `gate.allowed === false` — echo the reason and stop. Reasons: kill_switch, stage ≠ active, source not a blog, source not approved.

**Playbook gating (surfaces as `gate.produce_social` / `gate.produce_newsletter`):**
- `playbook.socialStrategy === "skip"` (e.g., `pandotic_client`) → `produce_social = false`. You generate **neither** `social_posts` NOR `quote_cards`.
- `playbook.newsletterEnabled === false` → `produce_newsletter = false`. You skip `newsletter_excerpt`.

If all three are skipped, tell the user there's nothing to repurpose under this playbook and stop — don't submit an empty payload.

**Advisory:**
- `brand_voice === null` — warn but proceed. Voice calibration will be weaker; mention in Phase 4 summary.
- `brand_assets === null` — you won't have pre-built hashtag sets. Generate inline.

#### Phase 1 — Extract key atoms from the source

Scratchpad (don't show the user):

1. **Thesis** — one sentence from the blog's opening.
2. **3–5 pull-quotes** — concrete sentences that stand alone.
3. **Primary keyword** — from `source_item.metadata.target_keyword`.
4. **Per-platform hooks** — rephrase the thesis into 5 different openings tuned for each platform.

#### Phase 2 — Generate children

Produce each child tuned to its platform. Honor the playbook gates — skip disabled sections.

**Platform rotation for 5 social posts: hardcoded order `[linkedin, twitter, instagram, facebook, linkedin]`.** Two LinkedIn variants because it's the highest-signal platform for Pandotic's audience; no `PlaybookConfig.enabledSocialPlatforms` field yet — that's future work.

**Platform constraints (must respect):**

| Platform | Body max | Hashtags max | Tone |
|---|---|---|---|
| `linkedin` | 3,000 chars (target 1,200–2,000 for reach) | 5 | Professional, insight-first |
| `twitter` | 280 chars | 3 | Tight, hook-forward, no em-dashes |
| `instagram` | 2,200 chars | 10 | Narrative, line-break friendly |
| `facebook` | 63,206 chars (target 80–250 for reach) | 3 | Conversational |

**Quote cards:** `body` is a single short quote (< 200 chars), one per platform (twitter, instagram, linkedin). Pulled directly from the blog. No hashtags.

**Newsletter excerpt:** title + body + excerpt suitable for pasting into a newsletter section. Body 150–400 words. Same voice as the source post.

**Voice + playbook:**
- Every child uses the same `brand_voice` tone as the source blog.
- `playbook.brandIsolation === true` → zero sibling-brand mentions.
- `playbook.crossPromotion === true` → at most one subtle cross-link (newsletter only; keep socials brand-focused).
- AI tells forbidden everywhere (see Skeptical Reviewer universal checks). Anticipate the gate.

#### Phase 3 — Write payload

Assemble the payload. Only include sections the playbook allows:

```json
{
  "social_posts": [
    { "platform": "linkedin",  "title": "optional", "body": "…", "hashtags": ["…"] },
    { "platform": "twitter",   "title": "optional", "body": "…", "hashtags": ["…"] },
    { "platform": "instagram", "title": "optional", "body": "…", "hashtags": ["…"] },
    { "platform": "facebook",  "title": "optional", "body": "…", "hashtags": ["…"] },
    { "platform": "linkedin",  "title": "optional", "body": "…", "hashtags": ["…"] }
  ],
  "newsletter_excerpt": { "title": "…", "excerpt": "…", "body": "…" },
  "quote_cards": [
    { "platform": "twitter",   "body": "<short quote>" },
    { "platform": "instagram", "body": "<short quote>" },
    { "platform": "linkedin",  "body": "<short quote>" }
  ]
}
```

**Playbook-gated sections (mirror the helper's enforcement):**
- If `gate.produce_social === false` → omit both `social_posts` and `quote_cards`.
- If `gate.produce_newsletter === false` → omit `newsletter_excerpt`.

Write to `/tmp/repurpose-<source-id>.json`. Then invoke:

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/repurposing-helper.ts --write <source-id> --payload /tmp/repurpose-<source-id>.json
```

The helper loops through each child and for each:
1. `submitToContentPipeline` — inserts `hub_content_pipeline` row with `source_content_id = source.id`, `drafted_by_agent = "marketing-repurposing-specialist"`, `status = "qa_review"`, channel/platform/content_type set per child type.
2. `requestQAReview` — inserts pending `hub_content_qa_reviews` row with `reviewer_agent = "marketing-skeptical-reviewer"`.

Returns `{ ok: true, source_id, children: [{ pipeline_id, qa_review_id, channel, platform, content_type }, …] }`.

#### Phase 4 — Summary

Echo to the user:

- Source title + slug
- Count of children produced (e.g. "9/9" or "5/9 — newsletter + quote cards skipped per pandotic_client playbook")
- Per-child: `{ channel, platform }` + pipeline id
- Next step literally: "Each child is in `qa_review`. Run `/skeptical-review <pipeline_id>` for each, or open the pipeline view: http://localhost:3001/marketing-ops/pipeline?source=<source_id>"
- Warnings if `brand_voice` or `brand_assets` were null.

Done. Total run time target: under 4 minutes.

---

## Edge cases

- **Source id not found** — helper exits with `{ "error": "…" }`. Tell the user and stop.
- **Source not a blog** (`channel !== "blog"`) — `gate.allowed = false`. Refuse. Only blog posts are atomized in this slice; other channels are future work.
- **Source not approved** (`status !== "approved"`) — `gate.allowed = false`. Refuse. User must run Skeptical Reviewer and human-approve first.
- **kill_switch = true** or **business_stage ≠ active** — `gate.allowed = false`. Refuse.
- **Playbook disables everything** — tell the user there's nothing to repurpose (e.g., a `pandotic_client` blog approved for internal case study has socialStrategy=skip AND newsletterEnabled=false). No empty-payload submission.
- **No brand_voice brief** — warn, proceed with neutral voice. Note in summary.
- **No brand_assets** — generate hashtags inline from the post body. Note in summary.
- **Already repurposed** — the helper does not check for prior repurposing. If the human has already run this skill on the same source, they'll get duplicate children. Ask before proceeding if you can see prior children in the Marketing Ops dashboard.

---

## Non-goals

- **Publishing** — you only write to `hub_content_pipeline`. No external posting.
- **Video or audio atoms** — no YouTube Shorts scripts, no podcast teasers in this slice.
- **Re-writing the source** — you consume the approved blog verbatim for quote cards; you paraphrase (not rewrite) for social bodies.
- **Skipping QA** — every child lands in `qa_review` and must pass the Skeptical Reviewer before publishing. No auto-approve even when `auto_pilot_enabled=true`.
- **Multi-source atomization** — one source id per run. Atomizing N posts is N calls.

---

## Debugging

If the write fails partway through:

1. Verify env: `echo $SUPABASE_URL && echo $SUPABASE_SERVICE_ROLE_KEY | wc -c` (should be > 100).
2. Re-read to confirm source status is still `approved`.
3. Check how many children landed: `SELECT id, channel, platform FROM hub_content_pipeline WHERE source_content_id = '<source-id>' ORDER BY created_at DESC`.
4. The helper is not transactional across children — if it errored after inserting 3 of 9, you'll have 3 orphaned children. Delete them and re-run, or run a partial-repurpose payload.
5. If a child's QA review row is missing (pipeline row created but no review row), insert manually: `INSERT INTO hub_content_qa_reviews (content_id, content_table, reviewer_agent) VALUES ('<pipeline-id>', 'hub_content_pipeline', 'marketing-skeptical-reviewer')`.
6. Check playbook config — if `gate.produce_social` was false but you included social_posts in the payload, the helper will reject the payload entirely.
