# Phase 3 Marketing Ops — Handoff Plan for Fresh Sonnet Session

## Context

You're picking up the Phase 3 Marketing Ops slice from `MARKETING_OPS_PHASE_3_PLAN.md`. Two of five skills are merged to main:

| Skill | Status | Merged in |
|---|---|---|
| 5.3 Brand Profile Builder | ✅ Merged | PR #50 (commit `7fc6250`) |
| 5.1 Marketing Director | ✅ Merged | PR #51 (commit `aafd044`) |
| **5.2 Skeptical Reviewer** | **TODO** (~1.5 days) | — |
| **5.4 Long-Form Writer** | **TODO** (~1.0 day) | — |
| **5.5 Repurposing Specialist** | **TODO** (~1.0 day) | — |
| **Registration script + validation pass** | **TODO** (~1.0 day) | — |

**Remaining effort:** ~4.5 days total.

**Note on repo state:** main has moved significantly past the Marketing Ops branches. Since PR #51 merged, Team Hub was ported into the Hub (#57/#58), promptkit landed (#56), error logging landed (#54), CMS admin sidebar landed (#55), and supabase CLI is now installed via a SessionStart hook (#53). `CLAUDE.md`'s active resume point is now Team Hub, not Marketing Ops — you'll need to read `MARKETING_OPS_PHASE_3_PLAN.md` directly, not CLAUDE.md. None of those merges touched any file you'll modify.

---

## Recommended execution: one Sonnet session per skill

Each session is ~1 day of work. Run them **in this order** — Reviewer first, Writer second, Repurposer third, registration+validation last. Reviewer must exist before Writer's "tell user to run `/skeptical-review {id}` next" end-state works. Repurposer needs approved blog content as input, which requires Writer + Reviewer both live.

Parallelizing Reviewer and Writer is possible (Writer's SKILL.md can say "Reviewer is being built in parallel — end with the slash command, don't import from it"), but serial costs one extra session's wall time for much cleaner review.

---

## Session 1: Skeptical Reviewer (~1.5 days)

**Branch:** `claude/marketing-ops-phase-3-skeptical-reviewer` from current main.

**Trigger:** `/skeptical-review {pipeline-item-id}` + natural language ("review the latest draft for speed", "QA pipeline item abc123").

**Files to create:**
- `packages/skill-library/skills/marketing-skeptical-reviewer/SKILL.md`
- `packages/fleet-dashboard/scripts/skill-helpers/skeptical-reviewer-helper.ts`

**Files to modify:**
- `packages/skill-library/skills-manifest.json` (append entry under "Marketing Ops" category)
- `packages/fleet-dashboard/package.json` (add `"skeptical-reviewer-helper"` script)

**Helper modes:**
- `--read <pipeline-item-id>` → returns JSON: `{ pipeline_item, brand_voice, recent_learnings (top 50 from hub_qa_learning_log for property), auto_pilot_setting (for this property+content_type), existing_reviews (prior QA runs for this item), gate }`
- `--write <pipeline-item-id> --payload <file.json>` → inserts `hub_content_qa_reviews` row via `createQAReview`, then flips `hub_content_pipeline.status` via `transitionContentStatus`:
  - `confidence >= threshold` AND `auto_pilot_enabled=true` for this `(property_id, content_type)` → `status = "approved"`
  - Else → `status = "needs_human_review"`

**Shipped helpers to reuse (all exported from cms-core):**

| Helper | File:line | Signature |
|---|---|---|
| `createQAReview` | `packages/cms-core/src/data/hub-qa.ts:17` | `(client, review: HubContentQAReviewInsert) → HubContentQAReview` |
| `getAutoPilotSettings` | `packages/cms-core/src/data/hub-qa.ts:62` | `(client, propertyId) → HubAutoPilotSettings[]` |
| `getRecentLearnings` | `packages/cms-core/src/data/hub-qa.ts:109` | `(client, propertyId, limit=50) → HubQALearningLog[]` |
| `transitionContentStatus` | `packages/cms-core/src/data/hub-content-pipeline.ts:89` | `(client, id, newStatus) → HubContentPipelineItem` |

Types are in `packages/cms-core/src/types/hub-qa.ts`.

**Payload schema Claude writes (spec section 7.4):**
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
    "grammar":            { "passed": true, "issues": [] }
  },
  "suggested_fixes": ["Replace 'let's dive in' with 'Here's the short version.'", "…"]
}
```

**Checks Claude performs (spec section 7.1 + 7.2):**
- Universal: factual claims, hallucination risk, brand voice match, tone consistency, AI tells (hard-coded list in SKILL.md: "in today's fast-paced world", "let's dive in", "not just X but Y", em-dash density), factual hedging, CTA clarity, length, cliché density, grammar
- Per-content-type: blog (thesis, structure, insight), social (char limit, hook, hashtags), press (AP style, dateline, 5 W's, boilerplate), email (subject specificity, single CTA, unsub), featured pitch (first sentence answers question, quotable insight)

**Image checks (spec section 7.3):** explicitly OUT OF SCOPE — deferred until Graphics Orchestrator ships. Say so in SKILL.md.

---

## Session 2: Long-Form Writer (~1.0 day)

**Branch:** `claude/marketing-ops-phase-3-long-form-writer` from current main (after Session 1 has merged).

**Trigger:** `/write-longform {brand-slug} --topic "…" --keyword "…"` + natural language.

**Files to create:**
- `packages/skill-library/skills/marketing-long-form-writer/SKILL.md`
- `packages/fleet-dashboard/scripts/skill-helpers/long-form-writer-helper.ts`

**Files to modify:** same as Session 1 (manifest, fleet package.json).

**Helper modes:**
- `--read <slug>` → returns `checkSkillPrereqs` result + playbook. Aborts if `allowed=false` or if `brandVoice` is null (no voice brief → refuse politely).
- `--write <slug> --payload <file.json>` → `submitToContentPipeline` with `channel="blog"`, `status="qa_review"`, `drafted_by_agent="marketing-long-form-writer"`, then `requestQAReview(client, pipelineId, "hub_content_pipeline", "marketing-skeptical-reviewer")`. Returns `{ ok: true, pipeline_id, qa_review_id }`.

**Shipped helpers to reuse:**

| Helper | File:line | Signature |
|---|---|---|
| `checkSkillPrereqs` | `packages/cms-core/src/data/hub-skill-contract.ts:16` | `(client, propertyId) → { allowed, reason?, property, brandVoice, brandAssets }` |
| `submitToContentPipeline` | `packages/cms-core/src/data/hub-skill-contract.ts:65` | `(client, item) → { id }` |
| `requestQAReview` | `packages/cms-core/src/data/hub-skill-contract.ts:79` | `(client, contentId, contentTable, agentName) → { id }` |

**Payload schema:**
```json
{
  "title": "…",
  "excerpt": "…",
  "body": "<markdown, 1500–3000 words>",
  "metadata": {
    "brief": "…",
    "target_keyword": "…",
    "estimated_read_time_min": 8
  }
}
```

**Prompt ingredients for drafting (from the helper's `--read` output):**
- `brandVoice.voice_attributes`, `tone_variations`, `vocabulary`, `anti_examples`, `example_posts`, `dos`, `donts`, `humor_guidelines`, `audience`
- `brandAssets.keywords` — SEO context
- `playbook.brandIsolation` → zero sibling-brand mentions when `true`

Brand voice fields live in `packages/cms-core/src/types/social.ts:25`.

**End-state:** SKILL.md summary prints "Run `/skeptical-review {pipeline_id}` next." Manual chain — no automatic skill invocation.

---

## Session 3: Repurposing Specialist (~1.0 day)

**Branch:** `claude/marketing-ops-phase-3-repurposing-specialist` from current main (after Sessions 1 and 2 merged).

**Trigger:** `/repurpose {pipeline-item-id}` + natural language ("atomize blog abc123", "repurpose that approved post").

**Files to create:**
- `packages/skill-library/skills/marketing-repurposing-specialist/SKILL.md`
- `packages/fleet-dashboard/scripts/skill-helpers/repurposing-helper.ts`

**Helper modes:**
- `--read <source-pipeline-id>` → returns `{ source_item, property, brand_voice, brand_assets, playbook, gate }`. Validates `source_item.status === "approved"` AND `source_item.channel === "blog"`; else `gate.allowed=false`.
- `--write <source-pipeline-id> --payload <file.json>` → loops through children. Each child: `submitToContentPipeline({ source_content_id: source.id, property_id: source.property_id, status: "qa_review", drafted_by_agent: "marketing-repurposing-specialist", ... })` then `requestQAReview(...)`. Returns `{ ok: true, source_id, children: [{ pipeline_id, qa_review_id, channel, platform }] }`.

**Payload schema:**
```json
{
  "social_posts": [
    { "platform": "linkedin", "title": "…", "body": "…", "hashtags": ["…"] },
    { "platform": "twitter",  "title": "…", "body": "…", "hashtags": ["…"] },
    { "platform": "instagram","title": "…", "body": "…", "hashtags": ["…"] },
    { "platform": "facebook", "title": "…", "body": "…", "hashtags": ["…"] },
    { "platform": "linkedin", "title": "…", "body": "…", "hashtags": ["…"] }
  ],
  "newsletter_excerpt": { "title": "…", "body": "…", "excerpt": "…" },
  "quote_cards": [
    { "platform": "twitter",  "body": "<short quote>" },
    { "platform": "instagram","body": "<short quote>" },
    { "platform": "linkedin", "body": "<short quote>" }
  ]
}
```

**Playbook gating (helper enforces; Claude doesn't generate disabled sections):**
- Skip `social_posts` + `quote_cards` if `playbook.socialStrategy === "skip"` (e.g., `pandotic_client`)
- Skip `newsletter_excerpt` if `playbook.newsletterEnabled === false`

**Platform rotation for 5 social posts:** hardcode `[linkedin, twitter, instagram, facebook, linkedin]`. `PlaybookConfig` has no `enabledSocialPlatforms` field today — that's future work.

---

## Session 4: Registration script + validation pass (~1.0 day)

**Branch:** `claude/marketing-ops-phase-3-validation` from current main (after Sessions 1–3 merged).

### Part A — Registration script (~0.5 day)

**File:** `packages/fleet-dashboard/scripts/register-marketing-agents.ts`

**Purpose:** One-shot upsert of `hub_agents` rows (via `createAgent` from `cms-core/data/hub-agents.ts`) for the SPEED property covering all 5 Phase 3 agents. Idempotent — `onConflict: "property_id,slug"`.

Rows to register for SPEED:
- `marketing-director` (`agent_type: marketing_director`)
- `marketing-skeptical-reviewer` (`agent_type: skeptical_reviewer`)
- `marketing-brand-profile-builder` (`agent_type: brand_profile_builder`)
- `marketing-long-form-writer` (`agent_type: long_form_writer`)
- `marketing-repurposing-specialist` (`agent_type: repurposing_specialist`)

All with `enabled=true`, `schedule=null` (manual only this phase), `config={}`, `created_by=<SERVICE_ROLE_KEY as implicit system user>`.

Add script entry to `packages/fleet-dashboard/package.json`: `"register-marketing-agents": "tsx scripts/register-marketing-agents.ts"`.

### Part B — End-to-end validation on SPEED (~0.5 day)

Per `MARKETING_OPS_PHASE_3_PLAN.md` validation checkpoint:

1. (Manual prerequisite) Seed SPEED's brand voice brief — one-time SQL or dashboard action. If the brief doesn't exist, every content-producing skill will refuse. Confirm before starting.
2. `/build-brand-profile speed` → verify `hub_brand_assets` populated
3. `/marketing-plan speed` → verify plan output is sensible
4. `/write-longform speed --topic "AI for K-12 reading curricula" --keyword "ASU GSV 2026"` → row in `hub_content_pipeline` with `status=qa_review`
5. `/skeptical-review {id}` → review row with checks + confidence; pipeline status flips to `needs_human_review`
6. Visit `/marketing-ops/pipeline/{id}` in dev — confidence badge renders, suggested fixes show
7. Click "approve" in UI → status flips to `approved`
8. `/repurpose {id}` → 9 child rows in pipeline, each referencing source via `source_content_id`
9. Each child gets a Skeptical Reviewer pass

**Success criterion:** steps 4–9 complete without manual SQL fixups. That validates the architecture and unblocks the next 5-agent batch.

---

## Universal rules for every session

**Match the exemplar shape exactly.** `packages/skill-library/skills/marketing-brand-profile-builder/SKILL.md` and `packages/skill-library/skills/marketing-director/SKILL.md` establish the structure:

```
---
frontmatter (name, description, user-invocable)
---
# Title
## How this works         ← table of who-does-what halves
### Invocation             ← list of trigger phrases
### Inputs and outputs     ← small table
### Phased execution       ← Phase 0 → Phase 4
#### Phase 0 — Orient
#### Phase 1 — …
#### Phase N — Summary
---
## Edge cases              ← bulleted
## Non-goals               ← bulleted
## Debugging               ← numbered recovery steps
```

**Helper pattern.** Match `brand-profile-helper.ts` and `marketing-plan-helper.ts`:
- TypeScript invoked via tsx
- `--read <id>` prints JSON context
- `--write <id> --payload <file>` mutates DB
- Env: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Usage-on-no-args → exit 2
- Clean error-message on failure → exit 1

**Critical constraint — don't cross-import cms-core subpaths from helpers.** tsx+CJS cannot resolve `@pandotic/universal-cms/data/*` subpaths (exports define `import` condition only). **Inline the types and minimal logic** (like the playbook map in `marketing-plan-helper.ts`). Cross-session shared helpers should stay inlined; refactoring the package exports is a separate concern.

**Commit + PR format per session:**
- One commit per session. Title: `feat(skills): add {Name} ({N}/5 Phase 3 marketing skills)`
- PR title same, body references `MARKETING_OPS_PHASE_3_PLAN.md` section 5.{N}
- Do not merge — leave for review.

**Verification before committing:**
- `pnpm --filter @pandotic/universal-cms build` — clean, no errors
- `pnpm -w run test` — 43/43 passing (unchanged count)
- Helper smoke test: `pnpm --filter @pandotic/fleet-dashboard {helper-name}` no args → Usage, exit 2
- Helper env check: unset `SUPABASE_URL` → clean message, exit 1
- `git diff` review — no accidental edits to unrelated files

---

## Open questions (already resolved — don't re-ask)

From the prior session's resolved list plus this plan:

1. **Skill location** → `packages/skill-library/skills/marketing-*` (existing convention).
2. **`auto_pilot_enabled`** → stays `false` for SPEED this phase. Everything flows through human review.
3. **Writer → Reviewer chaining** → Writer ends by writing the pipeline row + pending QA review row via `requestQAReview`, then tells the human "Run `/skeptical-review {id}` next." Manual chain, not automatic skill invocation. Simpler, matches the slash-command model, and lets the human preview the draft first.
4. **Brand voice brief for SPEED** → assumed to exist before validation runs. Out of scope to build a brief-generation skill this phase.
5. **Skill helpers and cms-core imports** → inline shared logic. Don't refactor cms-core package exports.

---

## Critical file paths (copy into every session prompt)

| Purpose | Path |
|---|---|
| Phase 3 spec | `MARKETING_OPS_PHASE_3_PLAN.md` (repo root) |
| Full master spec, section 7 for Reviewer | `Skill Onboarding/marketing-ops-master-spec.md` |
| SKILL.md exemplars | `packages/skill-library/skills/marketing-brand-profile-builder/SKILL.md`, `packages/skill-library/skills/marketing-director/SKILL.md` |
| Helper exemplars | `packages/fleet-dashboard/scripts/skill-helpers/brand-profile-helper.ts`, `marketing-plan-helper.ts` |
| QA data layer | `packages/cms-core/src/data/hub-qa.ts`, types at `packages/cms-core/src/types/hub-qa.ts` |
| Pipeline data layer | `packages/cms-core/src/data/hub-content-pipeline.ts`, types at `packages/cms-core/src/types/hub-content-pipeline.ts` |
| Skill-contract helpers | `packages/cms-core/src/data/hub-skill-contract.ts` |
| Playbook map (canonical, inline copy into helpers) | `packages/cms-core/src/data/hub-marketing-playbooks.ts` |
| Brand voice brief type | `packages/cms-core/src/types/social.ts:25` (`BrandVoiceBrief`) |
| Skill manifest | `packages/skill-library/skills-manifest.json` |
| Fleet scripts index | `packages/fleet-dashboard/package.json` |

---

## Files touched per session (for reference)

```
Session 1 (Skeptical Reviewer):
  packages/skill-library/skills/marketing-skeptical-reviewer/SKILL.md             NEW
  packages/fleet-dashboard/scripts/skill-helpers/skeptical-reviewer-helper.ts      NEW
  packages/skill-library/skills-manifest.json                                      MODIFIED
  packages/fleet-dashboard/package.json                                            MODIFIED

Session 2 (Long-Form Writer):
  packages/skill-library/skills/marketing-long-form-writer/SKILL.md                NEW
  packages/fleet-dashboard/scripts/skill-helpers/long-form-writer-helper.ts        NEW
  packages/skill-library/skills-manifest.json                                      MODIFIED
  packages/fleet-dashboard/package.json                                            MODIFIED

Session 3 (Repurposing Specialist):
  packages/skill-library/skills/marketing-repurposing-specialist/SKILL.md          NEW
  packages/fleet-dashboard/scripts/skill-helpers/repurposing-helper.ts             NEW
  packages/skill-library/skills-manifest.json                                      MODIFIED
  packages/fleet-dashboard/package.json                                            MODIFIED

Session 4 (Registration + validation):
  packages/fleet-dashboard/scripts/register-marketing-agents.ts                    NEW
  packages/fleet-dashboard/package.json                                            MODIFIED
  (plus validation pass — no code changes, just running the slash commands and logging results)
```

**No new migrations. No new types in cms-core. No new data helpers in cms-core.** Everything needed already shipped in the `00110–00117` migration block.
