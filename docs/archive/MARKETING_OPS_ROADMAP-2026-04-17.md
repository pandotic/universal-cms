# Marketing Ops Module — Remaining Work Roadmap

**Status as of 2026-04-17:** Schema + UI foundation shipped. Execution layer (agents, brand seeding, external integrations) not started.

**Branch shipped:** `claude/plan-skill-onboarding-8drJN` (4 commits, ~6,000 lines)

---

## What's Done

| Layer | Status |
|---|---|
| DB migrations 00110-00117 | ✅ Written (not yet applied to Hub Supabase) |
| Types in cms-core (10 new + 3 extended) | ✅ |
| Data functions (9 new + 1 extended) | ✅ |
| Playbook engine (pure functions) | ✅ |
| Universal skill contract helpers | ✅ |
| Feature toggles in admin-config | ✅ |
| Marketing nav dropdown | ✅ |
| `/marketing-ops` dashboard with health check | ✅ |
| `/marketing-ops/brands` list + detail with 5 tabs | ✅ |
| `/marketing-ops/pipeline` list + detail review screen | ✅ |
| `/marketing-ops/link-building` 3-tab command center | ✅ |
| `/marketing-ops/qa` 3-tab dashboard | ✅ |
| 14 API routes (brand-assets, brand-setup, content-pipeline [+id], qa-reviews, autopilot, qa-learning, link-building/*, featured) | ✅ |
| 43 tests passing, cms-core builds clean | ✅ |

---

## Critical Path to Operational (Priority Order)

### Phase 0 — Unblock Deployment (Est: 1 hour)

- [ ] Apply migrations 00110-00117 to Pandotic Hub Supabase (`rimbgolutrxpmwsoswhq`)
- [ ] Verify no RLS policy conflicts with existing `hub_social_content` users
- [ ] Smoke test: load `/marketing-ops` dashboard, verify no 500s

**Files:** `packages/fleet-dashboard/supabase/migrations/00110_*` through `00117_*`
**Risk:** Migration 00112 renames `hub_social_content` → `hub_content_pipeline`. If any external code references the old name, it breaks.

### Phase 1 — Brand Seeding (Est: 2-3 hours)

Without brands, the whole system is empty.

- [ ] Create a seed script at `packages/fleet-dashboard/scripts/seed-brands.ts` that inserts the 15 brands into `hub_properties`
- [ ] For each brand set: `name`, `slug`, `url`, `relationship_type`, `site_profile`, `business_stage`, `parent_property_id` (for studio products)
- [ ] Add `pnpm seed-brands` npm script
- [ ] Run Brand Profile Builder agent manually (Claude Code) for the 3 test brands: SafeMama, Pandotic, SPEED
- [ ] Populate `hub_brand_voice_briefs` + `hub_brand_assets` for those 3

**Source of truth for brand list:** `Skill Onboarding/marketing-ops-master-spec.md` section 3

### Phase 2 — Webhook Receiver (Est: 30 min)

Agents can't report status without this.

- [ ] Create `packages/fleet-dashboard/src/app/api/webhooks/agent-run/route.ts`
- [ ] POST handler: validates `x-api-key` header against `AGENT_WEBHOOK_SECRET` env
- [ ] Accepts `{ run_id, status, result, error_message }`
- [ ] Calls `updateAgentRun(supabase, runId, ...)` from `@pandotic/universal-cms/data/hub-agents`
- [ ] Sets `completed_at` when status is terminal (completed/failed/cancelled)

### Phase 3 — The Two Core Agents (Est: 6-8 hours)

Build these as Claude Code skills in `.claude/skills/marketing/`:

**3.1 Marketing Director** (orchestrator)
- [ ] Reads a property via `getPropertyBySlug`
- [ ] Calls `getPlaybookForProperty(property)` to get config
- [ ] Checks `kill_switch` and `business_stage === 'active'`
- [ ] Surveys: recent `hub_agent_runs`, pipeline items `needs_human_review`, `hub_brand_setup_checklist` gaps
- [ ] Outputs a weekly plan: what to draft, what's overdue, what to dispatch
- [ ] Invoked via slash command `/marketing-plan {brand-slug}`

**3.2 Skeptical Reviewer** (QA gate — CRITICAL)
- [ ] Subscribes to content pipeline items with status `qa_review`
- [ ] For each item: runs universal checks (factual, hallucination, brand voice match against `hub_brand_voice_briefs`, generic AI tells, CTA clarity)
- [ ] For images: Claude vision checks for text rendering, AI artifacts, brand color match
- [ ] Writes to `hub_content_qa_reviews` with `overall_confidence` + `checks` jsonb + `suggested_fixes`
- [ ] Transitions status to `needs_human_review` (if flagged) or `approved` (if autopilot threshold met)
- [ ] Invoked via `/api/agents/[id]/runs` POST

### Phase 4 — Validate on One Brand (Est: 2 hours)

Target: Pandotic SPEED (urgent ASU GSV timing, covers studio_product playbook).

- [ ] Seed SPEED brand + voice + assets
- [ ] Register Marketing Director + Skeptical Reviewer in `hub_agents` for SPEED
- [ ] Trigger Marketing Director run → inspect output
- [ ] Manually inject 1 draft blog post into `hub_content_pipeline` with status `qa_review`
- [ ] Skeptical Reviewer picks it up → writes QA review
- [ ] UI shows the item at `/marketing-ops/pipeline` with confidence badge
- [ ] Human clicks "approve" → pipeline transitions → published_at set

**If this works end-to-end, the architecture is validated and remaining agents are parallelizable.**

### Phase 5 — Content Agents (Est: 3-4 days)

Build in this order (each is a separate Claude Code skill):

- [ ] **Editorial Director** — owns calendar, generates content briefs
- [ ] **Long-Form Writer** — drafts blog posts (1500-3000 words) from briefs
- [ ] **Copywriter** — subject lines, social captions, ad copy
- [ ] **Repurposing Specialist** — atomizes one piece into many (blog → 5 social, podcast → 3 posts)
- [ ] **Graphics Orchestrator** — Templated.io + Unsplash integration

### Phase 6 — Distribution Agents (Est: 3-4 days)

- [ ] **Social Media Manager** — wraps Vista Social / Publer Business API
- [ ] **PR Strategist** — wraps existing Press Ranger skill
- [ ] **SEO Specialist** — keyword research via Apify MCP
- [ ] **Link Builder** — wraps existing Featured.com skill, adds directory submission tracking
- [ ] **Brand Profile Builder** — generates derivative brand assets (5-length descriptions, platform bios, NAP, JSON-LD) from a minimal input

### Phase 7 — Relationship & Research Agents (Est: 3-4 days)

- [ ] Head of Partnerships (CRM)
- [ ] Influencer Researcher (10x10 system)
- [ ] Podcast Booker (wraps Press Ranger podcast DB)
- [ ] Community Manager (Reddit/Discord monitoring via Apify)
- [ ] Email Marketing Manager (Beehiiv integration)
- [ ] Research Analyst (annual reports, quarterly studies)

### Phase 8 — Operations Agents (Est: 2-3 days)

- [ ] Analyst (Rybbit + PostHog aggregation)
- [ ] Customer Voice Researcher (Chatwoot pattern analysis)
- [ ] Compliance Officer (FTC/GDPR/WCAG checks)
- [ ] Link Monitoring Agent (weekly HTTP checks on `hub_link_submissions`)
- [ ] Review Site Claimer
- [ ] Social Profile Creator (Claude in Chrome)
- [ ] Directory Submission Agent (Claude in Chrome)

### Phase 9 — External Tool Integrations (Parallel with Phases 5-8)

- [ ] **Templated.io API** — image rendering from templates (Graphics Orchestrator)
- [ ] **Unsplash + Pexels API** — stock photo search (Graphics Orchestrator)
- [ ] **Chatwoot self-hosted** — VPS deploy, per-brand accounts, Captain AI
- [ ] **Beehiiv API** — newsletter platform per brand
- [ ] **Apify MCP** — scraping, SERP tracking, trend monitoring
- [ ] **Brave Search MCP** — live web search for research
- [ ] **Vista Social or Publer Business** — multi-brand social publishing API
- [ ] **BrightLocal** — local citations (FireShield only)

### Phase 10 — UI Polish (Est: 2-3 days)

- [ ] **Kanban board** — replace pipeline table with drag-drop columns (Drafted → QA → Needs Review → Revision → Approved → Scheduled → Published)
- [ ] **Streaming revision chat** — pipeline detail page middle panel, streams Anthropic responses with brand voice + content as context
- [ ] **Brand creation form** — currently requires direct `/api/properties` call; add UI at `/marketing-ops/brands/new`
- [ ] **Bulk link submission** — select opportunity + multi-select brands → batch-create submissions
- [ ] **Auto-pilot unlock recommendations** — QA dashboard surfaces "Ready to enable auto-pilot for: social posts on SafeMama (91% agreement)"
- [ ] **Setup task guidance** — each task row expands to show execution instructions
- [ ] **Asset generation trigger** — "Generate assets" button on brand detail Assets tab

### Phase 11 — GBI Cowork Integration (Est: 2 days)

Connect existing Cowork skills (featured-workflow, social-planner, followr-agent, content-publisher) to the Hub.

- [ ] Cowork skills read `hub_properties` for site registry instead of hardcoded list
- [ ] Cowork skills read `hub_brand_voice_briefs` for voice context
- [ ] Cowork skills write to `hub_content_pipeline` for drafted content
- [ ] Cowork skills report run status via `/api/webhooks/agent-run`
- [ ] Credential vault shared — Cowork stops hardcoding WordPress creds

---

## Known Issues & Trade-offs

### Blocking before production

1. **Migration 00112 data loss risk** — renames `hub_social_content` → `hub_content_pipeline`. If Phase 4 social content UI has been used in production, existing data carries over but any external code referencing the old table name breaks. **Verify zero production data before applying.**

2. **Agent type enum migration (00116)** — converts `agent_type` from Postgres enum to text+CHECK. Dropping the enum type may fail if other schemas reference it. Test on staging first.

3. **Pipeline review screen uses simple textarea** — the spec calls for embedded streaming LLM revision chat with three-panel layout. Current implementation is a textarea + "request revision" note. Functional but not the spec's vision.

### Accepted trade-offs

1. **Kanban is a table, not drag-drop** — simpler to ship, can upgrade later
2. **Content pipeline channel = text + CHECK** instead of enum (more flexible)
3. **Agent type = text + CHECK** instead of enum (easier to extend with 22+ values)
4. **Playbooks are code-level configs**, not DB rows (fewer moving parts)

### Deferred beyond MVP

- Link monitoring (weekly HTTP checks on live backlinks)
- Learning log export + Skeptical Reviewer auto-tuning from overrides
- Wikipedia presence tracking
- Trademark filing tracking
- Custom domain email setup automation
- Canva API integration (Enterprise only)
- Automated CAPTCHA handling

---

## File Map (for future sessions)

### Schema
- `packages/fleet-dashboard/supabase/migrations/00110_*` through `00117_*`

### Types (cms-core)
- `packages/cms-core/src/types/hub-brand-assets.ts`
- `packages/cms-core/src/types/hub-content-pipeline.ts`
- `packages/cms-core/src/types/hub-brand-setup.ts`
- `packages/cms-core/src/types/hub-qa.ts`
- `packages/cms-core/src/types/hub-link-building.ts`
- `packages/cms-core/src/types/hub-marketing-ops.ts`
- `packages/cms-core/src/types/hub-playbooks.ts`

### Data (cms-core)
- `packages/cms-core/src/data/hub-brand-assets.ts`
- `packages/cms-core/src/data/hub-content-pipeline.ts`
- `packages/cms-core/src/data/hub-brand-setup.ts`
- `packages/cms-core/src/data/hub-qa.ts`
- `packages/cms-core/src/data/hub-link-building.ts`
- `packages/cms-core/src/data/hub-marketing-ops.ts`
- `packages/cms-core/src/data/hub-playbooks.ts`
- `packages/cms-core/src/data/hub-skill-contract.ts`

### UI (fleet-dashboard)
- `packages/fleet-dashboard/src/app/marketing-ops/page.tsx`
- `packages/fleet-dashboard/src/app/marketing-ops/brands/page.tsx`
- `packages/fleet-dashboard/src/app/marketing-ops/brands/[slug]/page.tsx`
- `packages/fleet-dashboard/src/app/marketing-ops/pipeline/page.tsx`
- `packages/fleet-dashboard/src/app/marketing-ops/pipeline/[id]/page.tsx`
- `packages/fleet-dashboard/src/app/marketing-ops/link-building/page.tsx`
- `packages/fleet-dashboard/src/app/marketing-ops/qa/page.tsx`

### API routes (fleet-dashboard)
- `packages/fleet-dashboard/src/app/api/brand-assets/route.ts`
- `packages/fleet-dashboard/src/app/api/brand-setup/route.ts`
- `packages/fleet-dashboard/src/app/api/content-pipeline/route.ts`
- `packages/fleet-dashboard/src/app/api/content-pipeline/[id]/route.ts`
- `packages/fleet-dashboard/src/app/api/qa-reviews/route.ts`
- `packages/fleet-dashboard/src/app/api/autopilot/route.ts`
- `packages/fleet-dashboard/src/app/api/qa-learning/route.ts`
- `packages/fleet-dashboard/src/app/api/link-building/opportunities/route.ts`
- `packages/fleet-dashboard/src/app/api/link-building/opportunities/[id]/route.ts`
- `packages/fleet-dashboard/src/app/api/link-building/submissions/route.ts`
- `packages/fleet-dashboard/src/app/api/link-building/submissions/[id]/route.ts`
- `packages/fleet-dashboard/src/app/api/link-building/featured/route.ts`

### Source of truth docs
- `Skill Onboarding/marketing-ops-master-spec.md` — full architecture
- `Skill Onboarding/marketing-ops-checklist.md` — ~210 activities mapped to 22 agents
- `Skill Onboarding/GBI-Cowork-COO-Plan.md` — GBI-specific operations
- `Skill Onboarding/GBI-Knowledge-Base-Architecture.md` — Cowork skill modularity

---

## Decision Log

| Decision | Rationale |
|---|---|
| Generalize `hub_social_content` → `hub_content_pipeline` | Social is now a channel filter; one pipeline for all content types |
| New `hub_brand_setup_checklist` table | Setup (one-time) distinct from recurring agent work |
| Playbooks as code, not DB rows | 5 fixed playbooks, rarely change, faster lookups |
| Agent type = text + CHECK, not enum | Easier to extend with 22+ marketing agent types |
| Path B content pipeline | Keep existing social UI backwards-compatible during rollout |
| `business_stage` reused for parking_lot semantics | Avoids schema confusion; existing `maintenance` value maps cleanly |

---

## Estimated Timeline to Production

| Effort | Hours | Calendar |
|---|---|---|
| Phases 0-2 (schema applied + brands seeded + webhook) | ~4-5h | 1 day |
| Phase 3 (two core agents) | 6-8h | 1-2 days |
| Phase 4 (end-to-end validation on SPEED) | 2h | 0.5 day |
| Phases 5-6 (content + distribution agents, 10 agents) | ~6 days | 1.5 weeks |
| Phase 7-8 (relationship + ops agents, 12 agents) | ~5-6 days | 1.5 weeks |
| Phase 9 (external integrations, parallel) | ~4-5 days | Overlap with 5-8 |
| Phase 10 (UI polish — Kanban, streaming chat, etc.) | ~2-3 days | 0.5 week |
| Phase 11 (Cowork integration) | ~2 days | 0.5 week |
| **Total** | **~30 engineering days** | **~5-6 weeks** |

Validate after each phase. Don't build phase N+1 until phase N works end-to-end.
