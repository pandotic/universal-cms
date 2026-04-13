# GBI Cowork Knowledge Base — Architecture & File Map

## Architecture Decision: Library of Sub-MDs

The GBI operations knowledge base uses a **modular library** structure rather than a single monolithic document. Each skill reads the master index first (for site registry, plugin matrix, tech stack), then loads only the sub-documents relevant to its domain.

### Why This Structure
- Skills perform better with focused, right-sized context (not 500+ lines of everything)
- Different skills need different subsets — content-publisher doesn't need SalesBlink outreach details
- Updating one domain (e.g., adding a new site) means editing the INDEX, not hunting through a massive doc
- New skills can be added by creating a new SKILL.md that references existing knowledge docs

---

## File Map

### Knowledge Base (shared reference docs)
Location: `/mnt/.claude/skills/gbi-ops/`

| File | Purpose | Size | Referenced By |
|------|---------|------|--------------|
| **GBI-INDEX.md** | Master index: site registry, plugin matrix per site, tech stack, ClickUp workspaces, skill directory, Chrome domains | Central hub | ALL skills |
| **FEATURED-PLATFORM.md** | Complete Featured.com operations spec: 6 modules (Expert Q&A, Bylined Opps, Aggregated Opps, Publisher Requests, Content Strategy, Admin), account data, expert profiles, all URLs, post-publication 8-step checklist, graphic specs | Platform bible | featured-workflow, contributor-outreach, social-planner |
| **FOLLOWR-PLATFORM.md** | Followr.ai operations reference: all URLs, brand/company structure, integration status per brand, posting workflow, AI features, scheduling rules, integration expiration management | Platform reference | followr-agent, social-planner |
| **CONTENT-PUBLISHING.md** | Universal publishing checklist with full execution standards: SEO, images, authority, linking, affiliate, social, QA | Execution manual | content-publisher, featured-workflow |
| **SOCIAL-MEDIA.md** | Social operating model: scheduling rules, content mix, per-site platform requirements, post creation standards | Execution manual | social-planner, followr-agent |
| **ROUNDUP-EXPERT.md** | Roundup & expert contributor workflow: pre/post-publish steps, email sequences, Canva graphics, Featured.com & Authority Magazine ops | Execution manual | contributor-outreach, content-publisher |
| **SEO-LINKBUILDING.md** | SEO operations: broken links, Search Console, RankMath, Linksy audits, offsite SEO, directory submissions, backlink strategy | Execution manual | seo-outreach, site-maintenance |
| **SITE-MAINTENANCE.md** | Maintenance operations: plugin updates, affiliate checks, GA review, email, QA, backups, security, maintenance vs growth classification | Execution manual | site-maintenance |
| **SITE-STRATEGIES.md** | Per-site strategic priorities and content themes for all 7 GBI sites | Strategy reference | coo-briefing, content-publisher |
| **RECURRING-SCHEDULE.md** | Complete task schedule (weekly/biweekly/monthly/quarterly/bi-annual/one-time) with execution instructions and skill assignments | Task calendar | coo-briefing |

### Skills (executable workflows)
Location: `/mnt/.claude/skills/`

| Skill | SKILL.md Location | Knowledge Docs Used | Status |
|-------|-------------------|-------------------|--------|
| `featured-workflow` | `/mnt/.claude/skills/featured-workflow/SKILL.md` | INDEX + FEATURED-PLATFORM + CONTENT-PUBLISHING | ✅ Built (v2 — 6 modules, Expert+Publisher modes) |
| `content-publisher` | `/mnt/.claude/skills/content-publisher/SKILL.md` | INDEX + CONTENT-PUBLISHING | 🔲 To build |
| `social-planner` | `/mnt/.claude/skills/social-planner/SKILL.md` | INDEX + SOCIAL-MEDIA + FOLLOWR-PLATFORM + FEATURED-PLATFORM | ✅ Built (coordinator — plans content, creates ClickUp tasks, manages buffer) |
| `followr-agent` | `/mnt/.claude/skills/followr-agent/SKILL.md` | INDEX + FOLLOWR-PLATFORM + SOCIAL-MEDIA | ✅ Built (executor — Chrome automation in Followr.ai, has first-run exploration mode) |
| `site-maintenance` | `/mnt/.claude/skills/site-maintenance/SKILL.md` | INDEX + SITE-MAINTENANCE + SEO-LINKBUILDING | 🔲 To build |
| `coo-briefing` | `/mnt/.claude/skills/coo-briefing/SKILL.md` | INDEX + RECURRING-SCHEDULE + all sub-docs | 🔲 To build |
| `contributor-outreach` | `/mnt/.claude/skills/contributor-outreach/SKILL.md` | INDEX + ROUNDUP-EXPERT | 🔲 To build |
| `seo-outreach` | `/mnt/.claude/skills/seo-outreach/SKILL.md` | INDEX + SEO-LINKBUILDING | 🔲 To build |
| `analytics-reviewer` | `/mnt/.claude/skills/analytics-reviewer/SKILL.md` | INDEX + (Looker/GA4 instructions) | 🔲 To build |
| `prospect-tracker` | `/mnt/.claude/skills/prospect-tracker/SKILL.md` | INDEX + (Pandotic CRM instructions) | 🔲 To build |

### Output Documents (user-facing summaries)
Location: `/mnt/outputs/`

| File | Purpose |
|------|---------|
| **GBI-Cowork-COO-Plan.md** | High-level operations plan with timeline and workflow examples |
| **GBI-WordPress-Plugin-Library.md** | Detailed plugin catalog for HomeEP (full audit) |
| **GBI-Knowledge-Base-Architecture.md** | This file — architecture map |

---

## How Skills Use the Knowledge Base

```
User says: "Publish this article on HomeEP"

→ Triggers: content-publisher skill
→ Skill reads: GBI-INDEX.md (gets HomeEP domain, plugin info)
→ Skill reads: CONTENT-PUBLISHING.md (gets full checklist)
→ Skill executes: Navigate to homeenergyplanner.com/wp-admin
→ Skill follows: Every step in the Universal Content Publishing Checklist
```

```
User says: "What's on my plate this week?"

→ Triggers: coo-briefing skill
→ Skill reads: GBI-INDEX.md (gets all sites)
→ Skill reads: RECURRING-SCHEDULE.md (gets weekly/overdue tasks)
→ Skill queries: ClickUp (both workspaces) for due/overdue tasks
→ Skill presents: Prioritized briefing with actionable items
```

```
User says: "Schedule the social posts for this week's blog on SafeMama"

→ Triggers: social-planner skill
→ Skill reads: GBI-INDEX.md (gets SafeMama platforms: Instagram, Pinterest, Facebook)
→ Skill reads: SOCIAL-MEDIA.md (gets content mix rules, post standards)
→ Skill creates: ClickUp task(s) — event-driven (individual task for blog promotion)
→ Skill hands off to: followr-agent
  → followr-agent reads: FOLLOWR-PLATFORM.md (gets URLs, brand switching)
  → followr-agent opens: Chrome → app.followr.ai
  → followr-agent switches to: SafeMama brand
  → followr-agent creates: Posts per platform, schedules per buffer rules
```

---

## Open Items Requiring Dan's Input

1. **Affiliate plugin strategy**: Master doc says Lasso, but HomeEP has Affiliatable. Which is the standard going forward?
2. **Cross-site plugin audit**: Only HomeEP has been audited. Need to audit SafeMama, HelpMyBoomer, WildfireProtect, Thermostating, FireShield, ThankBetter.
3. **Social platform assignments**: HomeEP and WildfireProtect still show "TBD" for social platforms.
4. **Roundup email sequence**: Is it 3 or 4 total emails per contributor? (KB defaults to 4: pre-publish + live + 2 follow-ups)
5. **Linkbot vs Linksy overlap**: HomeEP has both — should Linkbot be removed?

---

## Build Priority (Next Steps)

| Priority | Action |
|----------|--------|
| **Next** | Build `content-publisher` skill (highest-value, most-used workflow) |
| **Then** | Build `site-maintenance` skill |
| **Then** | Build `coo-briefing` skill (needs the others to exist first) |
| **Then** | Build `contributor-outreach` skill |
| **Ongoing** | Audit plugins on remaining sites and update GBI-INDEX.md plugin matrix |
| **Ongoing** | Complete Followr.ai exploration via followr-agent first-run mode |
