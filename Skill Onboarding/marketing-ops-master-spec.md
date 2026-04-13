# Marketing Ops Module — Master Spec (Consolidated)

**Version:** 3.0 (consolidated)
**Status:** Planning artifact — to be reconciled against the actual `universal-cms` repo state in a Claude Code session
**Owner:** Dan / GBI / Pandotic
**Supersedes:** marketing-ops-spec.md (v1), marketing-ops-master-spec.md (v2), link-building-command-center.docx

---

## 0. How to Use This Document

This is a **planning artifact**, not a literal build spec. It was written in a Claude.ai conversation that did not have access to the actual `universal-cms` repo. Significant infrastructure already exists in the repo (the Pandotic Hub at `packages/fleet-dashboard`, the `hub_properties` / `hub_brand_voice_briefs` / `hub_social_content` / `hub_agents` tables from migrations 00100-00106, the EntityAdapter pattern, the Phase 3/4 data layer work).

Before any code is written, a Claude Code session should:

1. Read `CLAUDE.md`, `DASHBOARD.md`, `ROADMAP.md`, `IMPLEMENTATION_STATUS.md`, `QA_HARDENING_REPORT.md`
2. Read this spec and the companion `marketing-ops-checklist.md`
3. Inspect the actual Pandotic Hub Supabase project (`rimbgolutrxpmwsoswhq`) to verify deployed state
4. Produce a `RECONCILIATION.md` mapping every proposed component to one of: `already_built`, `partially_built`, `extends_existing`, `net_new`
5. Only then begin writing migrations and code

This spec describes design intent. Where the spec proposes building something the repo already has, prefer extending the existing thing.

---

## 1. Goal

Extend the Pandotic Hub with a marketing operations layer that runs as a virtual marketing department across ~15 brands organized into four categories (GBI personal, Pandotic Studio, Pandotic Studio Products, Pandotic Clients). The system handles brand profile management, content production, graphics generation, social publishing, PR, link building, customer service, original research, influencer relationships, podcast outreach, analytics, and editorial QA — coordinated by a Marketing Director agent and gated by a content pipeline with human review.

The system must support different orchestration playbooks for studio vs studio-product vs standalone vs client vs local-service brands, must enforce strict brand isolation (no Pandotic fingerprint on standalone brands, ever), and must reuse the existing `hub_*` schema and EntityAdapter pattern rather than parallel-building.

---

## 2. Architecture Overview

### 2.1 Three Layers

- **Layer 1 — Specialized agents.** ~22 narrow-scope agents organized into 8 departments. Each agent runs as a Claude Code skill that reads config from `hub_agents`, does its work, and reports run status back to `hub_agent_runs` via the planned `/api/webhooks/agent-run` endpoint. Stateless from the Hub's perspective.
- **Layer 2 — Marketing Director (coordinator).** Single agent that reads property state, applies playbooks (studio / studio-product / standalone / client / local-service), dispatches work to specialized agents, and queues tasks. Runs on schedule and on-demand.
- **Layer 3 — Content Pipeline + Dashboard views.** Every agent output flows through a Kanban-style content pipeline with human review gates, embedded LLM revision chat, and per-brand auto-pilot settings. Lives in `packages/fleet-dashboard` as new routes that mount EntityAdapters against the existing tables.

### 2.2 Where Things Live in the Existing Repo

| Concern | Existing location | New work |
|---|---|---|
| Property registry | `hub_properties` (migration 00100) | Extend with marketing-specific columns (relationship_type, stage, hosting fields, etc.) |
| Brand voice | `hub_brand_voice_briefs` (migration 00105) | Extend with vocabulary, sentence patterns, anti-examples, corrections journal, visual identity |
| Content pipeline | `hub_social_content` (migration 00105) | Generalize to handle blog posts, emails, press releases, etc. — either rename or parallel table |
| Agent framework | `hub_agents` + `hub_agent_runs` (migration 00104) | Extend `agent_type` enum with marketing agent types |
| Dashboard views | EntityAdapter pattern in `apps/dashboard/` and `packages/fleet-dashboard/` | Define multiple adapters for the same `hub_properties` table — marketing, hosting, bug tracking, agent runs |
| Audit log | `hub_activity_log` (migration 00103) | Use as-is for marketing actions |
| Groups / RBAC | `hub_groups`, `hub_users`, `hub_user_group_access` (migrations 00101, 00102) | Use as-is — GBI vs Pandotic Studio vs Pandotic Clients become groups |

### 2.3 External Tools (Plug In, Don't Build)

| Tool | Purpose | Cost notes | Status |
|---|---|---|---|
| Vista Social or Publer Business | Multi-brand social publishing | $21-49/mo or AppSumo LTD if available | TBD — check AppSumo first |
| Followr.ai (existing) | Chrome automation for partial brand coverage | Already paying for some brands | Keep for covered brands during transition |
| Canva Pro | Brand kit + template design (manual) | $15/mo (already paying) | Use for design; cannot use API (Enterprise only) |
| Templated.io | Programmatic image rendering from templates | $29/mo | Net new |
| Unsplash + Pexels APIs | Stock photography | Free | Net new |
| Chatwoot (self-hosted) | Multi-brand customer service | ~$10/mo VPS | Net new |
| Press Ranger | PR distribution + journalist DB | LTD owned | Already have, has working skill |
| Featured.com | Quote pitching + publisher platform | LTD owned | Already have, has working skill (v2, 6 modules) |
| BrightLocal | Local citations (FireShield only) | $2/citation | Pay as you go |
| Apify Starter | Scraping, monitoring, SERP, competitor research | $29/mo | Net new (use via MCP) |
| Brave Search MCP | Live web search | Free tier | Net new |
| Beehiiv | Newsletter platform per brand | Free → $39/mo | Net new |
| Rybbit Analytics | Content site analytics | Already paying for 10 sites | Already have |
| PostHog | SaaS product analytics (overflow for Rybbit) | Free tier | Net new |
| Termly | Privacy/ToS generation | $10/mo | Net new |
| MKT1 MCP Server | Marketing strategy frameworks | Sub fee, optional | Optional |
| coreyhaines31/marketingskills | Open-source Claude Code marketing skills | Free | Fork into `.claude/skills/` |

**Total external tooling cost: ~$130/mo across all brands.**

---

## 3. The Brand List

Roughly 15 active brands across 4 categories, plus parking-lot items. Every brand becomes a row in `hub_properties` with `relationship_type` and `stage` columns driving playbook selection and visibility.

### 3.1 GBI Personal (Dan's portfolio, no Pandotic attribution)

| Brand | Site profile | Stage | Notes |
|---|---|---|---|
| SafeMama | marketing_and_cms | active | High-authority parenting content site, Featured.com publisher candidate |
| Thermostating | marketing_and_cms | active | HVAC/home content with SEO traffic |
| HomeEP (Home Energy Planner) | marketing_and_cms | active | Solar/power calculator site, fully audited plugin stack |
| HelpMyBoomer (HMB) | marketing_and_cms | active | Senior content site, plugs into Senior Steward tools backend |
| ThankBetter | TBD | TBD | Status to be confirmed |
| Case Finders | marketing_only | parking_lot | Privacy-law lead generation, exploratory |
| ESGsource | marketing_and_cms | active | Standalone ESG content/directory site (built on universal-cms) |

### 3.2 Pandotic Studio (the parent)

| Brand | Site profile | Stage | Notes |
|---|---|---|---|
| Pandotic | marketing_and_cms | active | The studio itself, hub-and-spoke center for studio products |

### 3.3 Pandotic Studio Products (built and owned by Pandotic)

| Brand | Site profile | Stage | Notes |
|---|---|---|---|
| Pandotic SPEED | marketing_only | active | Special education compliance, ASU GSV pitch, NYC DOE target |
| BidSmart | marketing_only | active | HVAC bid analysis platform |
| HomeDoc | marketing_only | active | Home management platform |
| LeadSmart | marketing_only | active | Details TBD |
| ThinkAlike | marketing_only | active | Word association game web app |
| StudyPuppy | marketing_only | active | Recently added |
| FireShield Defense | marketing_only + local_service | active | Fire protection brand (was WildfireProtect) — Pandotic studio brand, BrightLocal target |
| Trash Fence Trail | marketing_only | parking_lot | Burning Man Project onboarding prototype |
| Promptastic | marketing_only | parking_lot | Standalone consumer Prompt Polisher |

### 3.4 Pandotic Clients (deployed software TO other companies)

Different marketing playbook: don't market the client brand, generate case studies and authority content for Pandotic FROM client wins.

| Brand | Stage | Notes |
|---|---|---|
| Riffle CM | active | Existing consulting engagement |
| POS360 | active | Existing consulting engagement |
| Archer Review | active | AI medical training video pipeline (MindPal + HeyGen) |
| (future client deployments) | parking_lot | Placeholder for new client work |

### 3.5 Stage System

The brands table needs a `stage` column with values:

- `active` — Currently being marketed, agents work on it, appears in default dashboard view
- `parking_lot` — Domain owned, brand exists, no active marketing work, agents skip it, appears only in Parking Lot view
- `archived` — Decommissioned, kept for historical record only
- `planning` — Future project, placeholder for ideas not yet built

The Marketing Director agent must check `stage = 'active'` (or treat non-active the same as `kill_switch = true`) before dispatching any work. The default dashboard view filters to `stage = 'active'`. A separate "Parking Lot" view shows everything else.

---

## 4. Schema Extensions

These are proposed additions to the existing `hub_*` tables. The Claude Code session should reconcile these against the actual deployed schema and produce migration files only after confirming the current state.

### 4.1 Property Registry Extension (proposed migration 00107)

```sql
-- Marketing categorization
ALTER TABLE hub_properties ADD COLUMN relationship_type text 
  CHECK (relationship_type IN ('gbi_personal', 'pandotic_studio', 'pandotic_studio_product', 'pandotic_client', 'standalone', 'local_service'));
ALTER TABLE hub_properties ADD COLUMN parent_property_id uuid REFERENCES hub_properties(id);
ALTER TABLE hub_properties ADD COLUMN site_profile text 
  CHECK (site_profile IN ('marketing_only', 'marketing_and_cms', 'app_only', 'local_service'));
ALTER TABLE hub_properties ADD COLUMN stage text DEFAULT 'active'
  CHECK (stage IN ('active', 'parking_lot', 'archived', 'planning'));

-- Hosting / deployment fields
ALTER TABLE hub_properties ADD COLUMN repo_url text;
ALTER TABLE hub_properties ADD COLUMN repo_name text;
ALTER TABLE hub_properties ADD COLUMN hosting_provider text;
ALTER TABLE hub_properties ADD COLUMN hosting_project_id text;
ALTER TABLE hub_properties ADD COLUMN cms_platform text;
ALTER TABLE hub_properties ADD COLUMN current_version text;
ALTER TABLE hub_properties ADD COLUMN deploy_branch text DEFAULT 'main';

-- Marketing-specific flags
ALTER TABLE hub_properties ADD COLUMN auto_pilot_enabled boolean DEFAULT false;
ALTER TABLE hub_properties ADD COLUMN kill_switch boolean DEFAULT false;
ALTER TABLE hub_properties ADD COLUMN analytics_provider text;
ALTER TABLE hub_properties ADD COLUMN analytics_site_id text;

-- Aggregated counts (denormalized for dashboard speed)
ALTER TABLE hub_properties ADD COLUMN open_bugs_count integer DEFAULT 0;
ALTER TABLE hub_properties ADD COLUMN content_pending_review_count integer DEFAULT 0;
ALTER TABLE hub_properties ADD COLUMN agent_errors_24h_count integer DEFAULT 0;
```

### 4.2 Brand Voice Extension (proposed migration 00108)

```sql
-- Voice modeling
ALTER TABLE hub_brand_voice_briefs ADD COLUMN voice_attributes text[] DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN tone_variations jsonb DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN vocabulary jsonb DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN sentence_patterns jsonb DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN anti_examples jsonb DEFAULT '[]';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN humor_guidelines text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN corrections_journal jsonb DEFAULT '[]';

-- Visual identity for graphics orchestrator
ALTER TABLE hub_brand_voice_briefs ADD COLUMN primary_color text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN accent_color text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN logo_url text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN font_family text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN photo_style_guide text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN photo_mood_keywords text[];
ALTER TABLE hub_brand_voice_briefs ADD COLUMN use_ai_generation boolean DEFAULT false;
```

### 4.3 Brand Assets Table — New (proposed migration 00109)

```sql
CREATE TABLE hub_brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  description_25 text,
  description_50 text,
  description_100 text,
  description_250 text,
  description_500 text,
  bio_twitter text,        -- 160 char
  bio_linkedin text,       -- 2000 char
  bio_instagram text,      -- 150 char
  bio_facebook text,       -- 255 char
  category_primary text,
  categories_secondary text[],
  keywords text[],
  press_boilerplate text,
  hashtags jsonb DEFAULT '{}',
  logo_urls jsonb DEFAULT '{}',
  nap_name text,
  nap_address text,
  nap_phone text,
  nap_email text,
  schema_jsonld jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id)
);
```

### 4.4 Content Pipeline Generalization (proposed migration 00110)

Two paths — Claude Code session picks based on whether Phase 4 frontend has been built.

**Path A (preferred if no production data):** Generalize `hub_social_content` by renaming to `hub_content_pipeline` and broadening enums to include all content types. Migration touches table name and enum values.

**Path B (safer if Phase 4 is in production):** Keep `hub_social_content` for social specifically, add a sibling `hub_content_items` table for blog posts / emails / press releases / featured pitches / newsletters / landing pages, and create a `hub_content_pipeline_view` that unions them for the Kanban UI.

### 4.5 QA + Auto-Pilot Tables (proposed migration 00111)

```sql
CREATE TABLE hub_content_qa_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_table text NOT NULL,
  reviewer_agent text NOT NULL,
  overall_confidence numeric,
  status text CHECK (status IN ('passed', 'flagged', 'failed')),
  checks jsonb,
  suggested_fixes text[],
  human_override boolean DEFAULT false,
  override_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE hub_auto_pilot_settings (
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  auto_pilot_enabled boolean DEFAULT false,
  confidence_threshold numeric DEFAULT 0.85,
  trust_score numeric DEFAULT 0,
  max_per_day integer,
  PRIMARY KEY (property_id, content_type)
);

CREATE TABLE hub_qa_learning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  check_type text,
  outcome text CHECK (outcome IN ('human_agreed', 'human_overrode', 'false_positive', 'false_negative')),
  human_feedback text,
  created_at timestamptz DEFAULT now()
);
```

### 4.6 Link Building Tables (proposed migration 00112)

```sql
CREATE TABLE hub_link_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  category text,
  industry text[],
  domain_authority integer,
  priority text CHECK (priority IN ('tier_1', 'tier_2', 'tier_3')),
  submission_method text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE hub_link_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES hub_link_opportunities(id),
  status text CHECK (status IN ('queued', 'submitted', 'pending', 'verified', 'live', 'rejected', 'failed')),
  submitted_url text,
  submitted_at timestamptz,
  verified_at timestamptz,
  last_checked_at timestamptz,
  is_live boolean,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE hub_featured_outbound_pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  question text,
  answer text,
  publication text,
  status text,
  pitched_at timestamptz,
  published_url text
);

CREATE TABLE hub_featured_inbound_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  contributor_email text,
  pitch_summary text,
  status text,
  received_at timestamptz
);
```

### 4.7 Other Operational Tables (proposed migration 00113)

```sql
CREATE TABLE hub_press_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  title text,
  body text,
  status text,
  distributed_via text,
  distributed_at timestamptz,
  pickup_count integer DEFAULT 0,
  pickup_urls text[]
);

CREATE TABLE hub_influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  name text,
  handle text,
  platform text,
  tier text CHECK (tier IN ('tier_1', 'tier_2', 'tier_3')),
  niche text,
  audience_size integer,
  engagement_rate numeric,
  fit_score numeric,
  notes text
);

CREATE TABLE hub_influencer_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid REFERENCES hub_influencers(id),
  interaction_type text,
  notes text,
  occurred_at timestamptz DEFAULT now()
);

CREATE TABLE hub_podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  podcast_name text,
  host_name text,
  niche text,
  audience_size integer,
  status text,
  pitched_at timestamptz,
  recorded_at timestamptz,
  episode_url text
);

CREATE TABLE hub_research_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id),
  title text,
  type text,
  status text,
  data_source text,
  published_url text
);
```

### 4.8 Agent Type Extension (proposed migration 00114)

```sql
ALTER TYPE agent_type ADD VALUE 'marketing_director';
ALTER TYPE agent_type ADD VALUE 'editorial_director';
ALTER TYPE agent_type ADD VALUE 'long_form_writer';
ALTER TYPE agent_type ADD VALUE 'copywriter';
ALTER TYPE agent_type ADD VALUE 'repurposing_specialist';
ALTER TYPE agent_type ADD VALUE 'graphics_orchestrator';
ALTER TYPE agent_type ADD VALUE 'social_media_manager';
ALTER TYPE agent_type ADD VALUE 'pr_strategist';
ALTER TYPE agent_type ADD VALUE 'seo_specialist';
ALTER TYPE agent_type ADD VALUE 'link_builder';
ALTER TYPE agent_type ADD VALUE 'influencer_researcher';
ALTER TYPE agent_type ADD VALUE 'podcast_booker';
ALTER TYPE agent_type ADD VALUE 'community_manager';
ALTER TYPE agent_type ADD VALUE 'email_marketing_manager';
ALTER TYPE agent_type ADD VALUE 'research_analyst';
ALTER TYPE agent_type ADD VALUE 'analyst';
ALTER TYPE agent_type ADD VALUE 'customer_voice_researcher';
ALTER TYPE agent_type ADD VALUE 'skeptical_reviewer';
ALTER TYPE agent_type ADD VALUE 'compliance_officer';
ALTER TYPE agent_type ADD VALUE 'brand_profile_builder';
ALTER TYPE agent_type ADD VALUE 'social_profile_creator';
ALTER TYPE agent_type ADD VALUE 'directory_submission_agent';
ALTER TYPE agent_type ADD VALUE 'review_site_claimer';
ALTER TYPE agent_type ADD VALUE 'link_monitoring_agent';
```

---

## 5. The Agent Fleet (22 agents across 8 departments)

Each agent runs as a Claude Code skill. The Hub stores config in `hub_agents`, the skill reads config and executes, and reports run status back via webhook to `hub_agent_runs`.

### Department 1: Office of the Marketing Director
**5.1 Marketing Director** — Coordinator. Reads property state, applies playbooks, dispatches work. Slash command `/marketing-plan {brand}` and scheduled daily run.

### Department 2: Content & Creative
**5.2 Editorial Director** — Owns content calendar, brand voice enforcement, content brief generation, gap analysis.
**5.3 Long-Form Writer** — Blog posts, guides, whitepapers, case studies, landing pages.
**5.4 Copywriter** — Short-form: subject lines, social captions, ad copy, CTAs, microcopy.
**5.5 Repurposing Specialist** — Atomizes one piece into many. Highest-leverage content agent.
**5.6 Graphics Orchestrator** — Stock + overlay via Templated.io + Unsplash by default.

### Department 3: Distribution & Growth
**5.7 Growth Director** — Distribution strategy, channel mix, cross-channel coordination.
**5.8 Social Media Manager** — Per-brand calendar, queues posts via API, comment monitoring.
**5.9 PR Strategist** — Press strategy, milestone planning, PR drafting (Press Ranger AI), journalist relationships.
**5.10 SEO Specialist** — Keyword research, on-page optimization, schema markup, GEO optimization.
**5.11 Link Builder** — Directory submissions, Featured.com outbound, broken link building, link reclamation.

### Department 4: Relationships & Outreach
**5.12 Head of Partnerships** — Relationship CRM, warming, co-marketing, joint webinars.
**5.13 Influencer Researcher** — 10x10 system per brand, Top X list production, warming engagement.
**5.14 Podcast Booker** — Pitch matching, outreach tracking, booking, post-interview asset harvesting.
**5.15 Community Manager** — Community identification, monitoring, engagement opportunity surfacing.

### Department 5: Email & Owned Audience
**5.16 Email Marketing Manager** — Beehiiv setup, lead magnets, sequences, newsletters, deliverability.

### Department 6: Original Research & Authority
**5.17 Research Analyst** — Annual industry reports, quarterly mini-studies, "State of [industry]" franchises.

### Department 7: Operations & Intelligence
**5.18 Head of Marketing Ops** — Credentials, sessions, audit review, cost tracking.
**5.19 Analyst** — Brand health dashboards (Rybbit + PostHog), reports, anomaly detection.
**5.20 Customer Voice Researcher** — Chatwoot patterns, review monitoring, testimonial extraction.
**5.21 Skeptical Reviewer** — QA gate. See Section 7.
**5.22 Compliance Officer** — FTC, GDPR, accessibility, voice violations, trademark conflicts.

### Department 8: Customer Support (cross-cutting)
**Support Operations** — Chatwoot self-hosted, per-brand accounts, AI chatbot via Captain.

### Bonus Agents from Link Building Doc

**Brand Profile Builder** — When new brand added, generates all derivative assets: descriptions in 5 lengths, social bios per platform, press boilerplate, JSON-LD, NAP, hashtags, categories. Writes to `hub_brand_assets`.

**Social Profile Creator** — Claude in Chrome agent. Creates social profiles across Tier 1/2/3 platforms. Pauses for CAPTCHAs.

**Directory Submission Agent** — Claude in Chrome. Two modes: agent-assisted (Chrome navigates and fills forms) and manual clipboard fallback (pre-filled data for human paste-and-submit).

**Review Site Claimer** — Claims brand profiles on G2/Capterra/Yelp/BBB/Angi/Thumbtack.

**Link Monitoring Agent** — Weekly HTTP check on all `hub_link_submissions`, flags lost links.

---

## 6. Universal Skill Contract

Every Claude Code skill MUST:

1. Accept `property_id` as primary input
2. Check `kill_switch` and `stage` before any action — abort if `kill_switch = true` or `stage != 'active'`
3. Pull credentials via the credential vault
4. Pull brand voice via `hub_brand_voice_briefs` if producing content
5. Pull brand assets via `hub_brand_assets` if producing submission-style content
6. Be idempotent — check existing state before creating
7. Log every action to `hub_agent_runs`
8. Support `dry_run` mode
9. Respect `site_profile`
10. Respect `relationship_type` — enforce isolation rules
11. For content-producing agents: write output to content pipeline with status `drafted` and trigger Skeptical Reviewer
12. Never publish directly — only the publishing layer (after approval) can push to external destinations

---

## 7. The Skeptical Reviewer (full spec)

**Role:** Acts as a harsh but fair editor reviewing every piece of content before it hits the human review queue. Provides confidence scoring and check-by-check QA results.

**Pipeline position:** Drafting agent → Graphics Orchestrator (if visuals) → Skeptical Reviewer → Content Pipeline

### 7.1 Universal Checks

- Factual claims — flag specific stats/dates/names not in source
- Hallucination risk — flag suspicious specifics with no citation
- Brand voice match — score against example_phrases and anti_examples
- Tone consistency
- Generic AI tells — "in today's fast-paced world," "let's dive in," "not just X but Y," excessive em-dashes
- Factual hedging — unattributed authority claims
- CTA clarity
- Length appropriateness
- Cliché/buzzword density
- Grammar and typos

### 7.2 Content-Type-Specific Checks

- **Social posts:** character limit, hook in first line, hashtag count
- **Blog posts:** clear thesis, logical structure, actual insight
- **Press releases:** AP style, dateline, lead answers 5 W's, news angle, boilerplate
- **Emails:** specific subject line, single clear action, unsubscribe compliance
- **Featured.com pitches:** first sentence answers question, quotable insight, credential
- **Directory submissions:** brand name correct, NAP matches `hub_brand_assets` exactly

### 7.3 Image Checks (Claude vision)

For AI-generated: text rendering, brand color match, AI artifacts (fingers, hands, faces), inappropriate content, copyright risk.

For stock + overlay (default): brand color overlay, title legibility (contrast), demographic match, no accidental logos, license check, mood match.

### 7.4 Output

Structured `hub_content_qa_reviews` record with confidence, checks, suggested fixes.

### 7.5 Learning Loop

Human overrides write to `hub_qa_learning_log`. Top 50 most recent learnings per brand inject into reviewer's prompt context.

### 7.6 Calibration

Start loose (warn often, block rarely) for 2-3 weeks. Tune from overrides. Image artifact detection takes ~1 month to dial in.

---

## 8. Link Building System

### 8.1 The Honest Truth About Automation

No browser agent fully automates directory submissions. CAPTCHAs, email verification, custom forms, login flows always require human intervention. Goal is maximizing the ratio of agent-handled to human-handled work.

CAPTCHA reality: Claude in Chrome and ChatGPT Agent Mode pause at CAPTCHAs and hand control to the human by design. Plan for 5-10 seconds per CAPTCHA. For a batch of 15 social profiles, expect ~15-20 interruptions, adding 2-3 minutes of human time to a 30-minute automated process.

For platforms requiring phone verification (Twitter/X), use OpenPhone or Google Voice with a dedicated number per entity.

### 8.2 The Complete Link Building Taxonomy

#### 8.2.1 Social Profile Links (Critical Priority)

**Tier 1 — Must-Have**
- Google Business Profile (only if local — FireShield)
- LinkedIn Company Page
- Twitter/X
- Facebook Business Page
- GitHub Organization (Pandotic, SPEED, BidSmart, HomeDoc)
- YouTube Channel

**Tier 2 — High Value (Week 1-2)**
- Crunchbase (Pandotic, SPEED)
- Product Hunt (any new Pandotic studio product launch)
- AngelList/Wellfound
- Instagram Business (SafeMama)
- Pinterest Business (SafeMama)
- Apple Podcasts / Spotify for Creators

**Tier 3 — Supporting (Week 2-4)**
- Medium (DA 96, content syndication)
- Substack (SPEED — education thought leadership)
- Reddit (careful engagement, not link drops)
- Quora (profile only, answers human-written)
- TikTok Business
- Threads
- Bluesky / Mastodon
- Gravatar

#### 8.2.2 Business Directories (High Priority)

**General**
- Yelp (DA 94, FireShield)
- BBB
- Foursquare/Swarm (powers Apple Maps)
- Hotfrog, Manta, Spoke, Brownbook (bulk)

**Industry-Specific**
- SPEED/Pandotic: EdSurge, EdTech Digest, ASU+GSV directory, Common Sense Education, ISTE
- SafeMama: Mom blogs directory, parenting.com resources, What to Expect, baby product review sites
- Thermostating: HVAC directories, This Old House resources, HomeAdvisor
- FireShield: Fire protection directories, contractor listings, HomeAdvisor, Angi, Thumbtack
- HomeEP: Solar/energy directories, EnergyStar partner listings, sustainability directories
- HelpMyBoomer: Senior services directories, AARP partner listings

**Local/NAP (FireShield priority)**
- Google Business Profile, Apple Maps, Bing Places (must be identical)
- Data aggregators: Neustar/Localeze, Factual, Acxiom, Infogroup
- Local chamber of commerce, city/county directories
- BrightLocal Citation Builder ($2/citation) for foundational set

#### 8.2.3 Review & Reputation Sites

- SaaS (Pandotic/SPEED/BidSmart/HomeDoc): G2, Capterra, GetApp, TrustRadius, Software Advice, TrustPilot
- Content sites (SafeMama/Thermostating/HomeEP/HMB): TrustPilot, SiteJabber
- Local (FireShield): Google Reviews, Yelp, BBB, Angi, HomeAdvisor, Thumbtack

Claiming = link. Reviews = ranking factor. Both matter.

#### 8.2.4 Press & Media Links (High Priority for Launch)

Press Ranger workflow:
1. Draft press release using Press Ranger AI
2. Distribute via wholesale channels (Yahoo Finance, AP News, Business Insider, Bloomberg)
3. Use journalist database to find 20-50 relevant reporters
4. Use podcast database to book guest appearances
5. Leverage AI indexing to get cited by ChatGPT, Perplexity, Gemini, Grok

**PR Link Value:** Single press release through Press Ranger generates 50-200+ links from news syndication, many DA 70+. Highest-ROI link building activity for a new brand.

#### 8.2.5 Content & Resource Links (Medium, Ongoing)

- Guest posts (SPEED on EdSurge, SafeMama on parenting blogs, FireShield on home safety blogs)
- Resource page outreach
- Broken link building
- Content syndication (Medium, LinkedIn Articles, Substack with proper canonicals)
- Infographics / data studies (SPEED has compelling data: special education compliance costs, IEP processing times)

#### 8.2.6 Technical/Foundational Links (Medium)

- URL shorteners (Bitly, TinyURL, Rebrandly)
- Wayback Machine submissions
- Schema markup / JSON-LD (Organization schema minimum on every site — generated by Brand Profile Builder)
- Google Search Console, Bing Webmaster Tools, Yandex, Pinterest verification
- RSS feeds

### 8.3 What Most Marketing Plans Miss

- **AI Search Optimization** — Getting cited by ChatGPT/Perplexity/Gemini/Grok is the new SEO. Press Ranger's AI indexing addresses this.
- **Brand SERP Management** — Own the entire first page of brand-name Google results: site, social, reviews, press, Crunchbase, LinkedIn.
- **Entity Building for Knowledge Panel** — Built from structured data across the web. Social profiles, Crunchbase, Wikipedia mentions, press, consistent NAP all feed into this.
- **Competitor Backlink Analysis** — Use Apify/Ahrefs/SEMrush. Add finds to `hub_link_opportunities`. Monthly cadence.
- **Link Velocity Management** — Don't build 500 links in a week then nothing for 3 months. Aim for 5-10 new links per week per brand for steady growth.
- **Link Reclamation** — Find unlinked brand mentions and request links. Google Alerts + Link Monitoring Agent surfaces these.
- **Internal Linking Strategy** — For SafeMama/Thermostating/HomeEP/HMB, the WordPress interlinking engine (Linksy + Linksy Pilot in existing plugin stack) is the complement.
- **Legal/Compliance** — SPEED needs careful brand messaging (FERPA implications, no student data claims). FireShield may need contractor licensing references in directory listings.

---

## 9. Content Pipeline UI

Lives in `packages/fleet-dashboard` at `/marketing-ops/pipeline`.

### 9.1 Kanban Board (`/marketing-ops/pipeline`)

Columns: Drafted | QA Review | Needs Human Review | Revision Requested | Approved | Scheduled | Published

Each card: brand badge, content type icon, title preview, drafted-by agent, confidence score, time in current status. Color-coded by urgency. Filters by brand, type, agent, date, status. Default view: "Needs Human Review across all brands" sorted by oldest first.

### 9.2 Three-Panel Review Screen (`/marketing-ops/pipeline/:contentId`)

- **Left:** Content preview (rendered as it will appear)
- **Middle:** Metadata + QA results (color-coded, one-click "accept fix" buttons)
- **Right:** Embedded streaming LLM revision chat — full context of content, brand voice, source, history

Type "make it shorter" or "change the opening — too corporate" and the original drafting agent revises in place.

### 9.3 Auto-Pilot Settings (`/marketing-ops/brands/:slug/settings/automation`)

Per content type: enabled toggle, confidence threshold, max per day cap. Trust score is read-only.

Defaults:
- Social posts: auto-pilot eligible
- Newsletter sections: auto-pilot per section, manual on assembled newsletter
- Blog posts: manual forever
- Press releases: manual forever
- Featured.com pitches: manual forever
- Email broadcasts: manual; transactional auto
- Customer service replies: Chatwoot Captain auto for common, escalate novel

### 9.4 Bulk Operations + Real-Time

Bulk approve, auto-expire drafts >72h, daily digest email. Supabase Realtime subscriptions for live updates.

---

## 10. Multi-View Dashboard via EntityAdapters

The fleet-dashboard already has the EntityAdapter pattern. Use it to mount multiple views over the same `hub_properties` table.

### 10.1 Marketing View (`/marketing`)
Columns: Brand | Type | Stage | Auto-Pilot | Pending Review | Last Published | Brand Voice Status | Agent Errors 24h | Health

### 10.2 Hosting View (`/deployments`)
Columns: Brand | Repo | Hosting | Current Version | Last Deploy | SSL Status | SSL Expires | Health

### 10.3 Bug Tracking View (`/issues`)
Columns: Brand | Open Bugs | Errors 24h | Last Error | Severity | Health

### 10.4 Agent Runs View (`/agents`)
Columns: Brand | Active Agents | Last Run | Run Status | Errors 24h | Next Scheduled

### 10.5 Parking Lot View (`/parking-lot`)
Filter: `stage IN ('parking_lot', 'archived', 'planning')`. Columns: Brand | Type | Stage | Last Touched | Notes

Same rows. Different lenses.

---

## 11. Playbooks: Studio vs Studio Product vs Standalone vs Client vs Local

### 11.1 Pandotic Studio (`relationship_type: pandotic_studio`)

Pandotic IS the marketing engine for its products. Build studio authority that flows to every product.

- Content theme: meta — building in public, lessons from launches, AI-native development
- Voice: founder-led (Dan), thought leadership
- Press: position as "the AI-native software studio"
- Every product launch double-counted as studio milestone
- Featured.com: one Pandotic contributor speaks across all products
- Newsletter: from Pandotic, covering portfolio
- Influencer focus: indie hackers, AI builders, vibe coders
- Podcast: studio angle, products as proof points

### 11.2 Pandotic Studio Product (`relationship_type: pandotic_studio_product`)

Inherits Pandotic authority. Maximize cross-pollination.

- Press releases: "Pandotic announces [Product]"
- Each product has own social handles, cross-promoted from Pandotic accounts
- Content shared between product site and Pandotic blog with proper canonicals
- Influencer outreach leverages Pandotic relationships
- Editorial calendar coordinated to avoid two products competing same week

### 11.3 GBI Personal / Standalone (`relationship_type: gbi_personal` or `standalone`)

Independent brand. Maximize independence and enforce isolation.

- ZERO mention of Pandotic
- Brand voice fully unique
- Founder/team narrative independent (persona-driven if needed)
- Press positions as authority in its niche
- Content stays on brand's site, syndicated only under brand name
- Influencer outreach niche-specific, built from scratch
- Featured.com uses brand-specific contributor profile
- Newsletter from brand-specific domain
- Credential isolation enforced at vault layer

### 11.4 Pandotic Client (`relationship_type: pandotic_client`)

Different from all other playbooks. Client is not the marketing target — Pandotic is, using client work as proof.

- Generate case studies for Pandotic blog (with permission)
- Generate Featured.com pitches referencing client deployments as proof points
- Generate Pandotic press releases about client wins (with permission)
- Generate conference talks where Pandotic shows what it built
- Skip social posting for client brand
- Skip influencer research for client brand
- Skip podcast booking for client brand
- DO track client engagement health (SLAs, MindPal workflow status, customer success)

### 11.5 Local Service (`relationship_type: local_service`)

For FireShield. Local citation focus.

- BrightLocal Citation Builder for foundational set
- Google Business Profile, Yelp, BBB, Angi, Thumbtack focus
- NAP consistency enforced via `hub_brand_assets.nap_*`
- Local press, not national
- Skip Featured.com outbound
- Reviews critical — actively solicit Google Reviews, BBB

---

## 12. Customer Service (Chatwoot)

Self-hosted Chatwoot, multi-tenant, one account per brand.

- Single instance on small VPS (DigitalOcean 1-click or Docker)
- Per-brand "accounts" inside Chatwoot for data isolation
- Per-brand chat widget on each site
- Per-brand AI chatbot via Chatwoot Captain trained on knowledge base
- Unified inbox the human monitors
- Customer Voice Researcher (5.20) reads patterns and feeds back to marketing

---

## 13. Brand Voice as Foundation

Most important data model in the system. Without it, every content agent produces generic output. Build first.

### 13.1 Per-Brand Setup

1. Define 5-7 voice attributes (SafeMama: warm, evidence-based, reassuring, practical, parent-to-parent)
2. Define tone variations (educational vs promotional vs supportive)
3. List preferred and banned vocabulary
4. Define sentence patterns (length, formality 1-10, question handling)
5. Provide 10-20 example phrases
6. Provide 10-20 anti-examples with explanations
7. Define audience persona
8. Set humor guidelines
9. Set visual identity (colors, fonts, photo style, mood keywords)

### 13.2 Enforcement

- Every content agent receives brand voice as context
- Skeptical Reviewer checks output against voice
- Corrections journal accumulates from human revision feedback
- Top 50 corrections per brand inject as "feedback to apply" in future drafts

---

## 14. Graphics Architecture

**Default:** Stock photo + brand overlay via Templated.io. AI generation only when `use_ai_generation = true`.

### 14.1 One-Time Setup Per Brand (3-4 hours)

1. Canva Pro brand kit (manual)
2. Design 6-8 core templates in Canva Pro
3. Recreate each in Templated.io with autofill fields
4. Store template IDs
5. Define visual tokens
6. Write per-brand photo style guide

### 14.2 Per-Content-Piece Workflow

1. Receives request from content agent
2. Looks up template ID and visual tokens
3. Generates Unsplash search keywords from title + style guide
4. Queries Unsplash API (fallback to Pexels)
5. Auto-selects top OR queues 3 candidates for human pick
6. Calls Templated API with template + photo + content fields
7. Stores rendered image in Supabase storage
8. Attaches to content pipeline record
9. Hands off to Skeptical Reviewer for image QA

### 14.3 Why Stock + Overlay Beats AI

- Authenticity matters for content brands — AI imagery still has a "feel"
- Stock is free at scale (Unsplash, Pexels free APIs)
- Stock is predictable
- Less QA needed
- Brand identity lives in the overlay, not the photo

AI generation reserved for: Pandotic studio products (technical audience), abstract concepts, cases stock can't deliver.

### 14.4 Migration Path

If Templated cost or limitations matter at scale, migrate to self-hosted Puppeteer + HTML/CSS renderer. Graphics Orchestrator interface stays identical.

---

## 15. Quick-Start: Validate on One Brand First

Before building all 22 agents, validate end-to-end on ONE brand. Suggested target: Pandotic SPEED (most urgent visibility need with ASU GSV Summit, covers studio_product playbook).

**60-minute minimum viable path:**

1. Apply migrations 00107, 00108, 00109 to Pandotic Hub
2. Seed `hub_properties` row for SPEED with relationship_type, stage, hosting fields
3. Create brand voice brief for SPEED (Section 13)
4. Run Brand Profile Builder agent (manually via Claude Code) to populate `hub_brand_assets`
5. Open Claude in Chrome, create LinkedIn company page using SPEED brand assets
6. Repeat for Twitter, GitHub org, Crunchbase
7. Open Press Ranger, draft press release about ASU GSV using SPEED boilerplate
8. Distribute via Press Ranger
9. Verify all created profile URLs logged back to `hub_link_submissions`

After this hour: 4-5 social profiles, press release ready, populated brand voice + assets, validated system. Infrastructure now in place to scale to every other brand.

---

## 16. Implementation Order

Strict order. Validate after each phase before proceeding.

**Phase 0 — Reconciliation (Day 1)**
- Read existing repo context
- Read this spec and the checklist
- Inspect actual Pandotic Hub Supabase state
- Produce `RECONCILIATION.md`
- STOP and review with Dan before proceeding

**Phase 1 — Schema Foundation (Days 2-3)**
- Write and apply migrations 00107-00114
- Add corresponding TypeScript types and data functions

**Phase 2 — Brand Seeding (Days 4-5)**
- Build minimal Brand Profile Builder
- Seed `hub_properties` for all 15 brands
- Populate brand voice + assets for 3 priority brands (SafeMama, Pandotic, SPEED)

**Phase 3 — Multi-View Dashboard (Days 6-9)**
- Define EntityAdapters: marketing, hosting, bug tracking, agents, parking lot
- Add fleet-dashboard routes for each
- Add property detail page with tabbed views

**Phase 4 — Content Pipeline + Skeptical Reviewer (Days 10-14)**
- Build Skeptical Reviewer with universal checks
- Build Kanban view
- Build three-panel review screen with embedded streaming chat
- Build auto-pilot settings page

**Phase 5 — First Content Agents (Days 15-19)**
- Editorial Director, Long-Form Writer, Copywriter, Repurposing Specialist
- Test full content flow end-to-end

**Phase 6 — Graphics (Days 20-22)**
- Set up Templated.io, design templates for 3 test brands
- Build Graphics Orchestrator
- Wire Unsplash + Pexels
- Add image QA to Skeptical Reviewer

**Phase 7 — Marketing Director Coordinator (Days 23-25)**
- Build Marketing Director with playbook engine
- Build /marketing-plan slash command
- Test with one brand of each relationship_type

**Phase 8 — Distribution Agents (Days 26-30)**
- Social Media Manager + chosen social tool
- PR Strategist + Press Ranger wrapping existing skill
- SEO Specialist
- Link Builder + Featured.com wrapping existing skill
- Brand Profile Builder full version
- Social Profile Creator (Claude in Chrome)
- Directory Submission Agent (Claude in Chrome)

**Phase 9 — Relationships + Email + Research (Days 31-35)**
- Influencer Researcher + CRM
- Podcast Booker
- Email Marketing Manager + Beehiiv
- Community Manager
- Research Analyst

**Phase 10 — Operations + Customer Service (Days 36-40)**
- Deploy Chatwoot self-hosted
- Customer Voice Researcher
- Analyst + brand health (Rybbit + PostHog)
- Compliance Officer
- Link Monitoring Agent
- Review Site Claimer

**Phase 11 — Polish + Onboard All Brands (Days 41-45)**
- Onboard remaining 12 brands
- Resolve QA queue items
- Tune Skeptical Reviewer thresholds
- Document everything in repo

---

## 17. Validation Checks

After each phase, verify:

- All new tables have RLS enabled
- All new skills implement universal contract
- Dry-run mode works
- No hardcoded credentials
- Kill switch test passes
- Stage filter test passes (parking_lot brands skipped)
- Studio/standalone isolation test passes
- Site profile guard test passes
- Idempotency test passes
- Audit log produces `hub_agent_runs` row per execution
- Skeptical Reviewer flags obvious issues
- Content pipeline review screen renders correctly
- Streaming chat works end-to-end

---

## 18. Open Questions for Dan

1. Is Phase 4 frontend (social content) already built, or only the data layer? Determines Path A vs Path B for content pipeline generalization.
2. Confirm Vista Social (or other AppSumo LTD) vs Publer Business vs continued Followr.ai use.
3. Is ThankBetter active or parking_lot?
4. Is BidAnalyzer separate from BidSmart, or the same product?
5. Should LeadSmart get more detail?
6. Confirm Pandotic clients live IN this module as `relationship_type: pandotic_client` rather than as a sibling client-ops module.
7. Do you want a fifth top-level relationship type for "Pandotic Tools / Utilities" (internal MindPal workflows) or do those just live as part of client engagements?
8. Which 3 brands should be the test set for Phase 2-7? (Suggested: SafeMama, Pandotic, SPEED.)
9. How should the Hub authenticate webhook calls from Claude Code skills reporting agent run status?

---

## 19. Out of Scope

- Paid advertising management
- Direct Canva API integration (Enterprise-only, not viable)
- Email service provider hosting (using Beehiiv)
- Wikipedia content creation
- Building competing tool to Publer/Press Ranger/Chatwoot
- Automated CAPTCHA bypass
- Cross-brand credential sharing beyond Pandotic studio products
- Building a CRM (use ClickUp + Supabase relationship tables)

---

## 20. Companion Document

See `marketing-ops-checklist.md` for the maximalist activity checklist (~190 activities mapped to the 22 agents and tool stack). This spec defines architecture; the checklist defines daily/weekly/monthly work.

---

**End of master spec. Claude Code session: read both this and the checklist, then produce RECONCILIATION.md before writing any code.**
