# Marketing Ops Phase 3 — Five-Agent Slice

**Goal:** Ship 5 agents that prove the orchestration loop end-to-end on Pandotic SPEED, then validate the whole loop before parallelizing the remaining 17.

**Branch:** `claude/marketing-ops-phase-3` (from main)
**Estimated effort:** ~6 working days
**Validation gate:** Roadmap Phase 4 — one-brand smoke test on SPEED before any further agents.

---

## Why these five (not all 22)

The original roadmap listed 22 agents in flat phases (5–8) as if they were equal effort. They aren't. This slice picks agents that:

1. **Prove the architecture** (Marketing Director + Skeptical Reviewer)
2. **Have no external tooling decisions** (no Vista Social vs Publer, no Beehiiv, no Templated.io)
3. **Are mostly prompt engineering on top of helpers we already shipped** (`checkSkillPrereqs`, `submitToContentPipeline`, `requestQAReview`, `getMarketingPlaybookForProperty`)
4. **Form a complete content loop** — orchestrate → generate → review → atomize

After this slice works, the next batch (Social Media Manager, Graphics Orchestrator, Email Marketing Manager, PR Strategist, SEO Specialist) gets a 30-min web-research pass each before any code, because they are tooling-dependent.

---

## Shared infrastructure (already shipped, reuse)

These exist in `packages/cms-core/src/data/`:

| Helper | What it does |
|---|---|
| `checkSkillPrereqs(client, propertyId)` | Returns `{ allowed, property, brandVoice, brandAssets }`. Gates on `kill_switch` and `business_stage === 'active'`. |
| `submitToContentPipeline(client, item)` | Inserts into `hub_content_pipeline` (default status `drafted`). |
| `requestQAReview(client, contentId, contentTable, agentName)` | Inserts the QA review row. |
| `getMarketingPlaybookForProperty(property)` | Returns the playbook config for the brand's `relationship_type`. All 5 playbooks pre-defined. |
| `updateAgentRun(client, runId, updates)` | Already in `hub-agents.ts`; webhook hits it. |

**Skill location convention.** Existing skills live at `packages/skill-library/skills/<name>/SKILL.md`. The roadmap mentioned `.claude/skills/marketing/` but that directory doesn't exist and would split the skill index. **Recommendation: use `packages/skill-library/skills/marketing-<agent>/SKILL.md`**, register in `packages/skill-library/skills-manifest.json`. Flagging in case you'd rather adopt `.claude/skills/`.

**Agent registration.** Before any skill can run, insert a `hub_agents` row per (property, agent) pair. Migration 00104 + 00116 already define the schema. Add a one-shot `pnpm --filter @pandotic/fleet-dashboard register-marketing-agents` script that registers all 5 agents for SPEED.

**Telemetry loop.** Every skill invocation must:
1. Insert a `hub_agent_runs` row with `status='running'`, `triggered_by='manual'` (or `'schedule'`)
2. POST to `/api/webhooks/agent-run` with the `run_id` and final status when done
3. Use `AGENT_WEBHOOK_SECRET` (already set up)

This is the same loop external runners use; running locally inside Claude Code calls the same endpoint via `fetch`.

---

## The five agents

### 5.1 Marketing Director (orchestrator)

**Purpose:** Reads brand state, decides what to do this week, dispatches no work directly — outputs a plan for the human.

**Trigger:** Slash command `/marketing-plan {brand-slug}`. Scheduled daily run is **out of scope this phase** (requires a runner; manual is fine for MVP).

**Reads:** `hub_properties`, `hub_brand_voice_briefs`, `hub_content_pipeline` (last 14 days + items in `needs_human_review`), `hub_brand_setup_checklist` (gaps), `hub_agent_runs` (last 7 days, errors), playbook config.

**Writes:** None directly. Returns markdown plan with sections: setup gaps to close, content to draft this week, items waiting on human review, agents that errored.

**Skill file:** `packages/skill-library/skills/marketing-director/SKILL.md` (~150 lines, mostly prompt + scaffolding).

**Implementation notes:** Pure read + LLM synthesis. The "playbook" governs which sections to render (e.g., `pandotic_client` skips social/newsletter sections). No Anthropic API call required if we let the user's Claude Code session do the synthesis.

**Effort:** 1 day.

---

### 5.2 Skeptical Reviewer (QA gate — already specced)

**Purpose:** Scores drafted content before it reaches the human review queue. Blocks generic AI tells, brand voice drift, hallucinated facts.

**Trigger:** Slash command `/skeptical-review {pipeline-item-id}`. Optionally invoked by the writer skill as its final step.

**Reads:** `hub_content_pipeline` row, `hub_brand_voice_briefs` (especially `anti_examples`, `voice_attributes`, `corrections_journal`), `hub_qa_learning_log` (top 50 most recent for this brand — injected into prompt).

**Writes:** `hub_content_qa_reviews` row with `overall_confidence`, `checks` JSONB, `suggested_fixes`. Transitions pipeline status to `needs_human_review` (default) or `approved` (if confidence ≥ `hub_auto_pilot_settings.confidence_threshold` AND `auto_pilot_enabled = true` for the brand+content_type).

**Skill file:** `packages/skill-library/skills/marketing-skeptical-reviewer/SKILL.md`.

**Implementation notes:** Spec section 7 has the full check list (universal + per-content-type + image checks). Image checks via Claude vision are **out of scope until Graphics Orchestrator ships** — phase 3 only does text. The check schema landing in `checks` JSONB:

```json
{
  "factual": { "passed": true, "notes": "..." },
  "hallucination_risk": { "passed": true, "flagged_phrases": [] },
  "brand_voice": { "score": 0.85, "violations": [] },
  "ai_tells": { "passed": false, "phrases": ["in today's fast-paced world"] },
  "cta_clarity": { "passed": true },
  "grammar": { "passed": true, "issues": [] }
}
```

**Effort:** 1.5 days.

---

### 5.3 Brand Profile Builder

**Purpose:** Single-shot generation of derivative brand assets so other agents have something to pull from.

**Trigger:** Slash command `/build-brand-profile {brand-slug}`. Idempotent — re-runs overwrite via UPSERT on `hub_brand_assets.property_id` (UNIQUE).

**Reads:** `hub_properties` (name, url, relationship_type, business_category), `hub_brand_voice_briefs` (tone, audience).

**Writes:** Single `hub_brand_assets` row containing: descriptions at 25/50/100/250/500 chars, social bios for Twitter/LinkedIn/Instagram/Facebook, primary + secondary categories, keywords, press boilerplate, NAP fields (when applicable), schema_jsonld.

**Skill file:** `packages/skill-library/skills/marketing-brand-profile-builder/SKILL.md`.

**Implementation notes:** Lowest-risk agent in this slice. One Anthropic API call with a structured output schema (or 5 calls if we want per-asset retries). No pipeline involvement. **Run this on SPEED first** — it's the prerequisite for the writer to have voice + asset context.

**Effort:** 0.5 day.

---

### 5.4 Long-Form Writer

**Purpose:** First content-producing agent. Drafts blog posts (1500–3000 words) from a brief.

**Trigger:** Slash command `/write-longform {brand-slug} --topic "..." --keyword "..."`. Brief can also be passed as a JSON file path.

**Reads:** Brand voice + assets via `checkSkillPrereqs`. Aborts if `allowed === false`.

**Writes:** One row in `hub_content_pipeline` via `submitToContentPipeline` with:
- `channel = 'blog'`
- `status = 'qa_review'`
- `drafted_by_agent = 'marketing-long-form-writer'`
- `body = <markdown>`, `title`, `excerpt`
- `metadata = { brief, target_keyword, estimated_read_time }`

Then calls `requestQAReview` to chain into Skeptical Reviewer.

**Skill file:** `packages/skill-library/skills/marketing-long-form-writer/SKILL.md`.

**Implementation notes:** Prompt is the whole game. Use `brandVoice.voice_attributes`, `tone_variations`, `vocabulary`, `anti_examples` as constraints in the system prompt. `brandAssets.keywords` for SEO context. **Hard cap on length** — long-form only, no social atomization here (that's 5.5).

**Effort:** 1 day.

---

### 5.5 Repurposing Specialist

**Purpose:** Highest-leverage content agent. One blog post → 5 social posts + 1 newsletter excerpt + 3 quote cards (text only this phase).

**Trigger:** Slash command `/repurpose {pipeline-item-id}`. Source must have `status = 'approved'` and `channel = 'blog'`.

**Reads:** Source `hub_content_pipeline` row, brand voice + assets.

**Writes:** Multiple `hub_content_pipeline` rows:
- 5 with `channel='social'`, `platform` rotating across `linkedin/twitter/instagram/facebook` based on playbook's enabled platforms
- 1 with `channel='newsletter'`
- 3 with `channel='social'`, `content_type='quote_card'` (text only — visual generation is Graphics Orchestrator)

All set `source_content_id = <source row id>` for traceability. All set `status = 'qa_review'` and trigger Skeptical Reviewer.

**Skill file:** `packages/skill-library/skills/marketing-repurposing-specialist/SKILL.md`.

**Implementation notes:** One Anthropic API call returning a structured array, then a loop of 9 `submitToContentPipeline` + `requestQAReview` pairs. Respect playbook's `enabledDepartments` — skip social if the brand's playbook excludes `distribution_growth` (e.g., `pandotic_client`).

**Effort:** 1 day.

---

## Validation checkpoint (matches Phase 4 in the roadmap)

Before declaring this slice done, run end-to-end on SPEED:

1. Seed SPEED's brand voice brief manually (the spec calls this a manual one-time step until Brand Voice agent is built — out of scope here)
2. `/build-brand-profile speed` → verify `hub_brand_assets` row populated
3. `/marketing-plan speed` → verify plan output is sensible
4. `/write-longform speed --topic "AI for K-12 reading curricula" --keyword "ASU GSV 2026"` → row lands in `hub_content_pipeline` with `status=qa_review`
5. Skeptical Reviewer auto-fires (or manually `/skeptical-review {id}`) → review row with checks + confidence
6. Visit `/marketing-ops/pipeline/{id}` in dev — verify confidence badge renders, suggested fixes show
7. Click "approve" in UI → status flips to `approved`
8. `/repurpose {id}` → 9 child rows in pipeline, each chaining back to source
9. Each child gets a Skeptical Reviewer pass

**If steps 4–9 work without manual SQL fixups, the architecture is validated and the next 5-agent batch is unblocked.**

---

## Out of scope this phase

- Image checks in Skeptical Reviewer (deferred until Graphics Orchestrator)
- Scheduled/cron triggers (manual slash commands only)
- Brand voice generation from scratch (assume a human or Claude Code session populates the brief once)
- Auto-pilot threshold tuning (`hub_qa_learning_log` writes happen, but the auto-approve path stays off until calibration)
- Publishing layer — `approved` rows sit there. No Vista Social, Beehiiv, WordPress, etc. writing.
- Anything that depends on Templated.io, Beehiiv, Press Ranger, Apify, Vista Social/Publer, Chatwoot, or BrightLocal

---

## Files this phase creates

```
packages/skill-library/skills/marketing-director/SKILL.md
packages/skill-library/skills/marketing-skeptical-reviewer/SKILL.md
packages/skill-library/skills/marketing-brand-profile-builder/SKILL.md
packages/skill-library/skills/marketing-long-form-writer/SKILL.md
packages/skill-library/skills/marketing-repurposing-specialist/SKILL.md
packages/fleet-dashboard/scripts/register-marketing-agents.ts   # one-shot SPEED bootstrap
```

Plus an entry per skill in `packages/skill-library/skills-manifest.json`.

No new migrations. No new types in cms-core. The shipped helpers cover everything.

---

## Open questions to resolve before kicking off

1. **Skill location** — `packages/skill-library/skills/marketing-*` (existing convention) or `.claude/skills/marketing/*` (roadmap text)?
2. **Brand voice brief for SPEED** — populate manually for the validation, or wait for a Brand Voice Generator agent (would add ~1 day)?
3. **Skeptical Reviewer trigger** — does Long-Form Writer end by *invoking* Skeptical Reviewer (via API/skill chain) or does it just write the QA review row in `pending` state and a separate slash command fires the review? Cleaner if it chains; simpler for MVP if it doesn't.
4. **Auto-pilot threshold for SPEED in this phase** — keep `auto_pilot_enabled = false` (everything goes to human review)? Recommended yes.

---

## Estimated total

| Agent | Days |
|---|---|
| Marketing Director | 1.0 |
| Skeptical Reviewer | 1.5 |
| Brand Profile Builder | 0.5 |
| Long-Form Writer | 1.0 |
| Repurposing Specialist | 1.0 |
| Registration script + validation pass | 1.0 |
| **Total** | **6.0 days** |

Compare to roadmap's flat estimate of "Phase 5 = 3–4 days for 5 agents" which understates the prompt engineering required.
