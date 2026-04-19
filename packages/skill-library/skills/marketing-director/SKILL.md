---
name: marketing-director
description: |
  Read a property's current marketing state on the Pandotic Hub (playbook, recent pipeline
  activity, items awaiting human review, setup gaps, agent errors) and synthesize a weekly
  plan for the human. Use when asked to "make a marketing plan", "what's next for {brand}",
  "marketing director for {brand}", "weekly plan for {brand}", or any variant of
  "/marketing-plan {brand-slug}". Takes a single input: the property slug (e.g. "speed",
  "safemama"). Read-only — never writes to hub_* tables.
user-invocable: true
---

# Marketing Director

Reads the full marketing state for a single property on the Pandotic Hub and synthesizes a weekly action plan for the human owner. One of the five Phase 3 marketing skills. See `MARKETING_OPS_PHASE_3_PLAN.md` section 5.1 in the repo root for the slice plan.

> **This skill is self-contained and read-only.** All logic is below; the only external dependency is the `marketing-plan-helper` script in `packages/fleet-dashboard/scripts/skill-helpers/`. No DB writes, no Anthropic API calls, no fanout to other skills.

---

## How this works

You are Claude running inside the user's Claude Code session. This skill has two halves:

| Half | Who does it | What it does |
|---|---|---|
| **Read context** | A TypeScript helper script (`marketing-plan-helper --read <slug>`) | Fetches property row, playbook config, recent 14 days of pipeline activity, items awaiting human review, incomplete setup tasks, and failed agent runs from the last 7 days. Returns JSON. Enforces kill_switch + business_stage gates. |
| **Synthesize plan** | You (Claude), in this session | Read the JSON context, apply playbook rules (skip disabled departments), write a markdown plan to the user with: setup gaps to close, content to draft this week, items waiting on human review, agents that errored. |

You do not call any external LLM API. You do not write to any `hub_*` table. The synthesis happens inside your own conversation — you are the planner.

### Invocation

The user invokes this skill by saying any of:
- `/marketing-plan speed`
- "What's next for SafeMama?"
- "Marketing director plan for pandotic"
- "Weekly plan for speed"

If the user hasn't specified a slug, ask for one and stop. Don't guess.

### Inputs and outputs

| In | Out |
|---|---|
| Property slug (e.g. `speed`) | Markdown plan with sections governed by the playbook |
|  | No DB writes, no side effects |

### Phased execution

Run these phases in order. Between phases, give the user a 1–2 sentence status update.

#### Phase 0 — Orient

Tell the user what you're about to do (2–3 sentences), confirm the slug, and read the context. No plan generated yet.

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/marketing-plan-helper.ts --read <slug>
```

The script prints a JSON blob with these top-level keys:

```json
{
  "property": {
    "id": "…",
    "name": "…",
    "slug": "…",
    "url": "…",
    "relationship_type": "pandotic_studio_product",
    "site_profile": "marketing_only",
    "business_stage": "active",
    "business_category": "…",
    "kill_switch": false,
    "auto_pilot_enabled": false,
    "domains": ["speed.pandotic.ai"]
  },
  "playbook": {
    "type": "pandotic_studio_product",
    "enabledDepartments": ["marketing_director", "content_creative", "distribution_growth", "…"],
    "contentTypes": ["blog", "social", "press", "newsletter", "landing_page"],
    "crossPromotion": true,
    "brandIsolation": false,
    "pressStrategy": "studio_attribution",
    "socialStrategy": "own_handles",
    "linkBuildingTiers": ["tier_1", "tier_2", "tier_3"],
    "featuredComEnabled": true,
    "newsletterEnabled": true,
    "podcastBookingEnabled": true
  },
  "recent_content":       { "since": "…", "total": 7, "by_status": { "drafted": 3, "approved": 2, "published": 2 }, "items": [ … ] },
  "needs_human_review":   [ { "id": "…", "channel": "blog", "title": "…", "qa_confidence": 0.72, "created_at": "…" }, … ],
  "setup_gaps":           [ { "category": "brand_identity", "task_name": "Create Brand Voice Brief", "status": "pending", "tier": "tier_1" }, … ],
  "recent_agent_errors":  { "since": "…", "total": 1, "items": [ { "agent_id": "…", "error_message": "…", "created_at": "…" } ] },
  "gate":                 { "allowed": true } or { "allowed": false, "reason": "…" }
}
```

**If `gate.allowed === false`, stop immediately.** Output exactly: `Brand is not active — {gate.reason}.` Do not generate any plan. Do not call the helper again. Do not suggest next steps beyond clearing the gate.

#### Phase 1 — Apply the playbook

Decide which sections to render based on `playbook`:

| Section | Render if |
|---|---|
| **Setup gaps** | Always (if `setup_gaps` is non-empty) |
| **Content to draft this week** | Always — content types limited to `playbook.contentTypes` |
| **Social cadence** | `playbook.socialStrategy !== "skip"` AND `playbook.enabledDepartments` includes `distribution_growth` |
| **Newsletter** | `playbook.newsletterEnabled === true` |
| **Press / Featured.com** | `playbook.featuredComEnabled === true` OR `playbook.pressStrategy !== "skip"` |
| **Podcast outreach** | `playbook.podcastBookingEnabled === true` |
| **Partnerships / Influencers** | `playbook.enabledDepartments` includes `relationships` |
| **Items waiting on human review** | Always (if `needs_human_review` is non-empty) |
| **Agent errors** | Always (if `recent_agent_errors.total > 0`) |

Hard examples:
- `relationship_type = pandotic_client` → playbook disables social, newsletter, featured.com, podcast. Render only setup gaps, content (case studies + press), review queue, agent errors.
- `relationship_type = local_service` → no newsletter, no featured.com, no podcast. Focus content on local press + social.
- `relationship_type = gbi_personal` → `brandIsolation = true`. Never mention Pandotic anywhere in the plan copy.

#### Phase 2 — Synthesize the plan

Write a single markdown response to the user with this shape. Skip any section the playbook disables or that has no data.

```markdown
# Weekly plan — {property.name} ({property.slug})

_Playbook: {playbook.type} · Stage: {property.business_stage} · Auto-pilot: {on/off}_

## Where things stand
- Content last 14 days: {total} items, breakdown: {by_status}
- Items awaiting your review: {count}
- Setup gaps open: {count} (tier_1: N, tier_2: N, tier_3: N)
- Agent errors last 7 days: {count}

## 1. Setup gaps to close
{bulleted list of tier_1 gaps first, then tier_2, then tier_3. Call out tier_1 items as "unblock first".}

## 2. Content to draft this week
{2–4 concrete content prompts fitting `playbook.contentTypes`. Each: channel, working title, why now. Do NOT draft the content — just the brief.}

## 3. Items waiting on your review ({N})
{list the needs_human_review items with id, channel, title, qa_confidence. Surface the lowest-confidence items first.}

## 4. Social cadence         ← skip if socialStrategy = "skip"
{platform mix from playbook.socialStrategy, cadence suggestion, what to repurpose from approved content.}

## 5. Newsletter             ← skip if newsletterEnabled = false
{single send recommendation with angle.}

## 6. Press / Featured.com   ← skip if featuredComEnabled = false AND pressStrategy = "skip"
{one pitch angle, one press moment if applicable to pressStrategy.}

## 7. Podcast outreach       ← skip if podcastBookingEnabled = false
{1–2 shows to target this week.}

## 8. Partnerships           ← skip if relationships not in enabledDepartments
{warm 1 relationship, 1 cold add.}

## 9. Agent errors to investigate
{list recent_agent_errors with agent_id, error_message, created_at. Suggest whether to re-run or escalate.}

## Next action
{one sentence — the single most important thing the human should do this week.}
```

Keep the plan focused. Target length: 400–800 words. Do not invent content beyond what the helper returned.

#### Phase 3 — Close

End with a one-line footer:

```
Source: marketing-plan-helper --read {slug} · Read-only · No writes performed.
```

Done. Total run time target: under 2 minutes.

---

## Per-field rules

When quoting or summarizing helper fields, respect these constraints:

- **`property.auto_pilot_enabled = false`** (current Phase 3 default) — all generated content still requires human review. Say so explicitly in the review section.
- **`needs_human_review` items** — surface `id` (so the human can jump to `/marketing-ops/pipeline/{id}`), `qa_confidence` (lowest first), `drafted_by_agent`. Don't quote the full body.
- **`recent_agent_errors.items[].error_message`** — include verbatim but truncate to ~120 chars if longer. Attach `created_at` for context.
- **`setup_gaps`** — group by `category`, order tier_1 → tier_2 → tier_3. Flag `execution_mode = "manual"` items as "needs a human".
- **`playbook.contentTypes`** — the `contentTypes` whitelist is authoritative. Never suggest a channel outside this list (e.g., no newsletter pitch for `pandotic_client`).
- **`brandIsolation = true`** — zero references to Pandotic, GBI, or sibling brands in the plan copy, even in passing.

---

## Edge cases

- **Slug not found** — Helper exits with `{ "error": "…" }`. Relay the message to the user and stop.
- **`gate.allowed === false`** — Refuse. Output exactly: `Brand is not active — {gate.reason}.` Don't generate a plan, don't suggest workarounds beyond clearing the gate.
- **Empty `recent_content` + empty `needs_human_review`** — This is a cold-start brand. The plan's "Where things stand" is 0/0/0. Lean the plan heavily on setup gaps and a single "seed content" brief.
- **Empty `setup_gaps`** — Great, say so in "Where things stand" and skip section 1.
- **`recent_agent_errors.total = 0`** — Skip section 9 entirely.
- **`playbook.enabledDepartments` excludes `distribution_growth`** (e.g., `pandotic_client`) — Skip sections 4, 5, 6, 7 entirely.
- **No brand voice brief referenced anywhere in helper output** — That's expected; this skill does not fetch voice. Just proceed; the content briefs you emit are prompts, not drafts, so voice enforcement is the writer's problem.

---

## Non-goals

- **No DB writes.** This skill is strictly read + synthesize. Never write to `hub_content_pipeline`, `hub_agents`, `hub_agent_runs`, `hub_brand_setup_checklist`, or any other `hub_*` table. If the user asks you to "also draft the blog post" or "mark that task done", tell them that's a separate skill (`/write-longform` for drafting, the Marketing Ops dashboard for task completion).
- **No fanout to other skills.** Don't invoke `/write-longform`, `/skeptical-review`, `/repurpose`, or `/build-brand-profile` from inside this plan. Reference pipeline items by `id` only — chaining is explicitly out of scope this phase.
- **No scheduled runs.** Manual slash command only. Scheduled daily runs are Phase 4+ work.
- **No Anthropic API call.** Claude synthesizes the plan in-session from the helper's JSON.
- **No cross-brand comparison.** One brand per invocation. Multi-brand digests are a separate future skill.
- **No content drafting.** The "Content to draft this week" section is prompts only (channel + working title + why now). Actual body generation belongs to `/write-longform` or `/repurpose`.

---

## Debugging

If the helper fails:

1. Verify env: `echo $SUPABASE_URL && echo $SUPABASE_SERVICE_ROLE_KEY | wc -c` (should be > 100).
2. Smoke-test usage: `pnpm --filter @pandotic/fleet-dashboard marketing-plan-helper` (no args) should print `Usage: marketing-plan-helper --read <slug>` and exit 2.
3. Re-run the read to confirm the property exists and gate is passing.
4. Check that migrations 00100 (hub_properties), 00104/00116 (hub_agents, hub_agent_runs), 00110/00111 (hub_brand_setup_checklist, hub_content_pipeline) have been applied to the Hub Supabase project.
5. If Supabase throws on the `hub_brand_setup_checklist` or `hub_content_pipeline` queries, confirm those tables exist on the Hub project (`rimbgolutrxpmwsoswhq`). They ship in the Phase 3 migration set.
6. If the plan references a playbook field that looks wrong for the brand, check `property.relationship_type` against `packages/cms-core/src/data/hub-marketing-playbooks.ts` — that file is the authoritative map.
