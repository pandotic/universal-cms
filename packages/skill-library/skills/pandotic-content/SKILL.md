---
name: pandotic-content
description: |
  Pandotic Master Project Content + Product Review — generates comprehensive marketing
  content, product state audits, and screenshot capture briefs from the actual codebase.
  Use when asked about: marketing content for a Pandotic project, case study, portfolio
  piece, project review, website copy, video script, sales blurb, screenshot brief,
  product audit, product landing page, or any request to turn a Pandotic project into
  marketing-ready assets. Also use when the user says "pandotic-content", "project content",
  "marketing content", "case study", "portfolio entry", "screenshot brief", "product page",
  "landing page", or asks to document a project for the Pandotic website or sales materials
  — even if they don't use those exact words. Also triggers for file output, saving content
  to the pandotic_site repo, or generating project pages for pandotic.ai.
  Trigger for any Pandotic project, not just Study Partner.
user-invocable: true
---

# Pandotic Master Project Content + Product Review

Turn the current state of any Pandotic project into grounded, accurate marketing content and a tailored screenshot capture brief — all based on what is actually built, not what was planned.

> **This skill is self-contained.** All templates, checklists, and specs are inlined below. No external reference files are needed.

## How This Works — Phased Execution

This skill runs in **4 phases** to keep output manageable. The default is to run all phases in sequence.

### Step 0: Orientation (Always First)

Before doing any deep work, your **first response** should be a brief orientation that gives the user a chance to steer:

1. **What this skill does** — 2-3 sentences explaining you'll produce marketing content, internal strategy notes, screenshot briefs, and a product landing page from the actual codebase
2. **What the outputs will be** — show the phase table below so they know what's coming
3. **Quick project scan** — do a fast read of README, package.json, and top-level files. Summarize in 3-5 bullet points: what the project appears to be, who it's for, what stack it uses, what state it's in
4. **Questions / clarifications** — ask anything you need before starting:
   - What to emphasize (tone, angle, audience)?
   - Any features to highlight or skip?
   - Project slug preference?
   - Any directional notes?

**Wait for the user to respond** before proceeding to Phase 1. If they say "go" or "run it" with no notes, that's fine — proceed.

### Phase Overview

| Phase | What it produces | Sections |
|-------|-----------------|----------|
| **Phase 1: Inspect** | Code audit, product inventory, alignment check | 1-2 |
| **Phase 2: Public Content** | Case study, portfolio, blurbs, video scripts, features | 3-8 |
| **Phase 3: Strategy & Synthesis** | Internal capabilities, proof points, differentiators, product page | 9-12, 16 |
| **Phase 4: Screenshots & File Output** | Screenshot brief, links, gaps + write all files | 13-15, file output |

### Default: Run All Phases in Sequence

After the user confirms from Step 0, **run all 4 phases automatically** in order. Between each phase, give a brief summary of what was produced (2-3 sentences, not a repeat of the content) and then continue to the next phase without waiting — unless the user previously asked to pause between phases.

The user can also request a single phase (e.g., "just run Phase 2") if they want targeted output.

---

## Phase 1: Inspect the Code and Product Reality

Do this before writing a single word of marketing copy. This phase produces **Sections 1-2**.

### 1A. Code / GitHub Sync Check

Determine and document:

- **Current branch** — what branch is checked out?
- **Recent commits** — last 5-10 commits that reveal feature or UI changes
- **Freshness** — is local ahead, behind, or potentially stale vs remote?
- **Recent UI/feature/copy changes** — anything that affects the product story?
- **Uncertainties** — anything you could not verify

### 1B. File Survey

Review the files most likely to define the current experience:

| Priority | What to look for |
|----------|-----------------|
| 1 | README, CLAUDE.md, any project overview docs |
| 2 | package.json / config files (stack, dependencies, scripts) |
| 3 | Main app entry files (App.tsx, main.tsx, index.html) |
| 4 | Route definitions / page files |
| 5 | Key feature components and modules |
| 6 | Data layer / API / integration files |
| 7 | Environment examples (.env.example) |
| 8 | Landing pages, marketing copy, sales material if present |
| 9 | Architecture notes, planning docs, feature specs |
| 10 | Screenshots or demo credentials if present |

### 1C. Product Inventory

For each major page, module, feature, or flow, record:

- **Name** — what is it called?
- **Purpose** — what does it do?
- **User value** — why does the user care?
- **Status** — one of: `live` / `partial` / `unclear` / `planned`
- **Marketing-ready?** — strong enough to feature in content?
- **Screenshot-worthy?** — visually compelling enough to capture?

### 1D. Product Experience Assessment

After the inventory, synthesize:

- What appears **strongest** right now?
- What appears most **differentiated**?
- What most clearly shows **AI value**?
- What most clearly shows **speed, workflow improvement, or business usefulness**?
- What appears **visually compelling**?
- What appears **unfinished, confusing, or not ready to highlight**?

### 1E. Running Product Inspection (If Possible)

If you can access the running product (preview tools, deployed URL, local dev server), check it. If not, infer from the code — that's fine.

When you can inspect:
- What is actually visible and working?
- What is placeholder or partial?
- Which flows are coherent enough for public marketing?
- What is visually strongest?
- What demonstrates AI value, workflow improvement, guardrails?
- What should NOT yet be highlighted publicly?

### 1F. Conflict Resolution

- If code says one thing and old docs say another → **trust the code**
- If a feature is in the code but not visible in the UI → mark as `partial`
- If a feature is referenced in docs but not in the code → mark as `planned`
- Note all conflicts in the output so the team can verify

### Phase 1 Output: Sections 1-2

**Section 1 — What I Believe This Project Is:** Product name, what it does, who it serves, business problem, what's notable, Pandotic's role, key assumptions, any git/code-state caveats. This is a sanity check — get alignment before writing content.

**Section 2 — Current Code and Product-State Review:** The full sync check (2A), product inventory table (2B), and experience notes (2C) as documented above.

---

## Phase 2: Public Content

This phase produces **Sections 3-8** — all the public-facing marketing content. Run this after Phase 1 is reviewed and confirmed.

### Section 3 — Website Case Study Draft

Write a polished, website-ready case study. This is the flagship output.

Structure:
- **Headline** — compelling, specific
- **Subheadline** — expands the headline
- **The Challenge** — the business problem in human terms
- **The Solution** — what Pandotic built and why this approach
- **What It Does** — core product walkthrough (not a feature dump)
- **Key Features** — 4-6 features tied to outcomes
- **Why It Works Better** — differentiation, not just description
- **Business Impact** — credible outcomes (no invented metrics)
- **Responsible AI / Guardrails / Oversight** — how safety and review are handled
- **Pandotic's Role** — what Pandotic specifically contributed
- **Closing Paragraph / Soft CTA** — invite the reader to learn more

The case study should tell a story: problem → insight → solution → impact.

### Section 4 — Short Portfolio Version

For a portfolio grid or project list page:
- 1 headline
- 1 short paragraph (2-3 sentences)
- 3 value-oriented bullet points (outcomes, not features)

### Section 5 — Homepage / Sales Blurbs

Write:
- **Homepage blurb** — 40-60 words, punchy
- **Medium portfolio blurb** — 80-120 words, more detail
- **Sales-oriented blurb** — emphasize speed, innovation, practical AI, safety
- **3 alternate short taglines** — varied angles

### Section 6 — 1-2 Minute Video Script

Natural, founder-friendly. Should sound like a real person speaking, not a corporate narrator.

Structure:
1. Opening hook (grab attention with the problem or insight)
2. The business problem (relatable, specific)
3. What we built (clear, visual language)
4. What makes it smarter or better (the "aha")
5. How AI was used responsibly (guardrails, oversight)
6. Business value / impact (credible outcomes)
7. Closing statement (memorable, forward-looking)

### Section 7 — 30-Second Video Script

Shorter cut for promo, homepage video, or social. Same voice, tighter structure. Should work as a standalone piece.

### Section 8 — Standout Features Section

Highlight the most compelling features or capabilities — the things that make someone say "that's clever."

For each one:
- What it does
- Why it matters to users
- Why it matters to the business
- Whether it feels differentiated
- Whether this capability is extensible to other projects

Do not just list UI elements. Explain why each feature exists and what problem it solves.

---

## Phase 3: Strategy & Synthesis

This phase produces **Sections 9-12 and 16**. Sections 9-10 are internal-only. Sections 11-12 bridge internal capabilities to outward-facing proof. Section 16 is the product landing page.

### Section 9 — Secret Sauce / Internal Capability Notes

**Internal-only** — not for public content. Documents the reusable Pandotic capabilities behind the project.

#### A. Technical Capability Inventory

For each capability found in the project, document:

- **What it is** — the pattern, system, or technique (be specific and technical)
- **Why it's powerful** — what makes this approach better than the obvious alternative
- **What's unique about Pandotic's implementation** — the twist, the insight, the non-obvious design choice
- **Complexity hidden from the user** — what hard problems are solved invisibly

Look for:
- AI workflow orchestration (multi-step chains, fan-out/fan-in, fallback logic)
- Prompt architecture (system prompts, knowledge injection, subject-specific routing, hint scaffolding)
- Retrieval / search design (RAG, vector search, knowledge graphs, concept mapping)
- Structured data extraction (document parsing, multi-format intake, schema inference)
- Automation logic (pipeline orchestration, background processing, retry/recovery)
- Personalization / adaptation (user modeling, difficulty adjustment, preference learning)
- Real-time AI features (streaming, speech-to-text, text-to-speech, voice interaction)
- Content generation pipelines (structured output, multi-modal generation, quality validation)
- Scoring, grading, or classification systems
- Human-in-the-loop patterns (review flows, approval gates, override mechanisms)
- Guardrails and safety (input validation, output filtering, rate limiting, content moderation)
- Integration patterns (API orchestration, third-party service coordination, auth flows)
- Data architecture (schema design, RLS, multi-tenant patterns, migration strategy)
- Fast MVP methodology (what shortcuts were smart, what was deferred wisely)
- Analytics and instrumentation (usage tracking, engagement signals, learning metrics)

#### B. Architecture Decisions Worth Noting

Call out decisions that reflect Pandotic's thinking — not just what was built, but why it was built this way. These are the things that would impress a technical evaluator or a CTO reviewing the work.

### Section 10 — Extensible Capabilities: What Else Could This Solve?

**Internal-only** — the strategic section. Take each capability from Section 9 and map it forward.

For each major capability:
- **Capability name** — short, reusable label
- **What it does in this project** — 1 sentence
- **What's generalizable** — the abstract pattern
- **3-5 other use cases** — specific, concrete applications (not vague)
- **Client types who would pay for this**
- **What it would take to adapt** — weekend of config, or a rebuild?
- **Engagement angle** — workshop, prototype sprint, full build, bolt-on?

**Synthesis: Pandotic Capability Map** — Which capabilities cluster into offerings? What's the strongest "we've already built this" story? What engagement types does this project support? Any capability gaps?

### Section 11 — Reusable Proof Points

Write 8-12 short, modular proof points for proposals, pitch decks, LinkedIn, sales collateral.

Each should be:
- 1-2 sentences
- Credible and outcome-oriented
- Specific enough to be convincing
- Free of unsupported hard-number claims

Format: "Built [capability] that [outcome] for [user type], using [approach] to [business result]."

### Section 12 — Technical Differentiators (Outward-Facing)

Bridge between internal capability notes (9-10) and public content. Write 3-5 short paragraphs translating the technical "secret sauce" into language suitable for:
- A CTO or VP Engineering evaluating Pandotic
- A pitch deck slide about technical approach
- A proposal's "why us" section

Focus on outcomes: "We designed the system so that [business result], which means [stakeholder benefit]."

### Section 16 — One-Page Product Landing Page

Write a complete one-page product landing page for `pandotic.ai/<project-slug>`. This synthesizes the best content from other sections into a CMS-ready markdown page.

#### YAML Frontmatter

```yaml
---
title: "<Project Name>"
slug: "<project-slug>"
tagline: "<subheadline text>"
hero_screenshot: "screenshots/<filename>"
video_id: "<project-slug>-long"
has_live_demo: true/false
demo_url: "<url or null>"
own_site_url: "<url or null>"
status: draft
generated: <ISO 8601 date>
---
```

If the project has its own site, set `own_site_url` and CTA links there. If demo-only, use `demo_url`. If no public access yet, CTA is "Learn more" / "Get in touch."

#### Page Structure

1. **Hero** — Headline (most compelling statement), subheadline (1-2 sentences), screenshot placeholder `![Hero](screenshots/<filename>)`, primary CTA
2. **What It Solves** — 2-3 paragraphs on the problem, drawn from Section 3's Challenge but punchier
3. **How It Works** — 3-5 capabilities with bold titles + 1-2 sentence descriptions, from Section 8
4. **Video Section** — `{{video-embed: <slug>-long}}` placeholder with 1-sentence description. Videos are produced from scripts in Sections 6-7 and hosted on this page
5. **Why It's Different** — 2-3 paragraphs from Sections 3 + 12
6. **Proof Points** — Best 4-6 from Section 11, as a grid or bullet list
7. **About Pandotic Footer** — 2-3 sentences on Pandotic's role, soft CTA, `{{contact-link}}`

**Rules:** Must stand alone (no "as mentioned in..." references). 600-900 words body content. The page lives at `pandotic.ai/<project-slug>`.

---

## Phase 4: Screenshots, Links, Gaps & File Output

This phase produces **Sections 13-15** and then **writes all files** from all phases.

### Section 13 — Screenshot Capture Brief

This must be tailored to the specific project based on Phase 1 findings. It should read like a targeted operations brief that anyone (or any tool — Claude Chrome, Puppeteer, a human with a browser) can execute.

#### A. Pre-Capture Verification
- Confirm looking at the latest code/build
- Verify current environment or deployed version
- Note any uncertainty about branch or freshness
- Prefer running product over stale docs if they differ

#### B. Capture Priorities

List exact pages, flows, modules, and screens to prioritize. For each:
- **Page or flow name**
- **What step/state to capture** (e.g., "after uploading a file", "with 3 flashcards visible")
- **What business story it helps tell**
- **Suitable for:** website / case study / deck / video / internal-only

#### C. Shot-by-Shot Instructions

| Field | Description |
|-------|-------------|
| **Filename** | Recommended filename (e.g., `study-guide-generated.png`) |
| **What to open** | URL path or page name |
| **Pre-capture actions** | What to click, expand, or interact with before capture |
| **Capture type** | Full-page, cropped, or focused on a specific element |
| **What to emphasize** | The key visual story |
| **What to avoid** | Unfinished elements, sensitive data, placeholder text |
| **Usage** | Public-safe or internal-only |

#### D. Capture Quality Rules
- Avoid broken or placeholder states
- Avoid exposing secrets, API keys, or non-public data
- Use realistic, non-sensitive data in all captures
- Prefer readable, well-populated screens
- Capture the most visually compelling working states
- Note if a page should be skipped until polished
- Use consistent viewport size across captures
- Prefer light mode unless dark mode is a selling point

#### E. Marketing Readiness Flags

Watch for: incomplete UI, placeholder text ("Lorem ipsum", "TODO"), fake metrics, misleading labels, broken buttons/links, outdated branding, internal terminology, sensitive data, console errors, loading spinners.

#### F. Top 5 Must-Have Captures

Choose the five highest-priority screenshots. For each:
- **What to capture** — specific page and state
- **Why this matters** — what story it tells
- **Where to use it** — website hero, case study inline, deck slide, video b-roll
- **Risk factors** — anything that could make this shot look bad

### Section 14 — Links / Demo / Access Notes

Pull into a clean section: live URL, staging URL, demo URL, login steps, demo credentials, notes on what can or cannot be shared publicly. If unavailable, say so clearly.

### Section 15 — Missing Info / Follow-Up Gaps

List the highest-value missing inputs: measurable outcomes, screenshots not yet captured, customer quotes, rollout results, guardrail details, demo access, anything that would make content more credible. Do not stall — produce the best draft first, then list gaps.

### File Output

After all sections are generated (across all phases), save each to its own file.

#### Determine the Project Slug
1. Check `package.json` name field, the repo folder name, or ask the user
2. Slugify: lowercase, hyphens, no special characters (e.g., "Study Partner" → `study-partner`)

#### Write Files Locally

Create `pandotic-content-output/<project-slug>/` in the current project repo:

```
<project-slug>/
  metadata.yaml
  case-study.md              # Section 3
  portfolio.md               # Section 4
  blurbs.md                  # Section 5
  video-script-long.md       # Section 6
  video-script-short.md      # Section 7
  features.md                # Section 8
  proof-points.md            # Section 11
  tech-differentiators.md    # Section 12
  screenshot-brief.md        # Section 13
  links.md                   # Section 14
  product-page.md            # Section 16
  internal/
    secret-sauce.md          # Section 9
    extensible.md            # Section 10
```

**Sections NOT written to files:** 1 (alignment check), 2 (code review), 15 (gaps) — these stay in conversation only.

#### Push to pandotic_site Repo

Also write files to `pandotic/pandotic_site` at `docs/projects/<project-slug>/`. This is the canonical location the pandotic.ai CMS builds from.

- **If GitHub MCP tools are available:** Push directly, create a branch like `content/<project-slug>`, open a PR for review
- **If not available:** Write locally and instruct the user to copy/PR to `docs/projects/<slug>/` in pandotic_site
- **If already inside pandotic_site:** Write directly to `docs/projects/<slug>/`

Always confirm the slug and output path with the user before writing.

#### Per-File Frontmatter

Every markdown file gets CMS-ready YAML frontmatter:

```yaml
---
section: <section-number>
title: "<Section title>"
project: "<project-slug>"
status: draft
generated: "<ISO 8601 date>"
---
```

Section 16 (product-page.md) uses its own extended frontmatter as specified above.

#### metadata.yaml

Written at the project directory root:

```yaml
project_name: "<Human-readable name>"
slug: "<project-slug>"
client: "<client name or 'internal'>"
generated: "<ISO 8601 date>"
generated_by: "pandotic-content skill"
status: "draft"
has_live_demo: true/false
demo_url: "<url or null>"
live_url: "<url or null>"
own_site_url: "<url or null>"
repo_url: "<url or null>"
hero_screenshot: "screenshots/<recommended-hero-filename>"
video_long_id: "<project-slug>-long"
video_short_id: "<project-slug>-short"
sections_included:
  - case-study
  - portfolio
  - blurbs
  - video-script-long
  - video-script-short
  - features
  - proof-points
  - tech-differentiators
  - screenshot-brief
  - links
  - product-page
  - internal/secret-sauce
  - internal/extensible
tags:
  - "<industry>"
  - "<technology>"
  - "<capability>"
```

---

## About Pandotic — Voice and Positioning

Pandotic is a small consultancy and venture studio that helps organizations take fast, practical leaps into AI adoption. We build and launch useful products, prototypes, workflows, automations, and digital experiences that solve real business problems.

### What the Content Should Reinforce (Where True)

- Pandotic helps organizations move quickly from idea to implementation
- Speed and responsible execution can coexist
- AI should solve real business problems, not just look impressive
- We build practical systems, not just demos
- We focus on outcomes, not only features
- We use guardrails, human oversight, thoughtful workflow design
- We build for usability, launchability, and real-world adoption

### Voice

Smart, clear, modern, practical, confident, grounded, credible, human, business-aware.

### Tone

- Innovative but not hypey
- Strategic but not bloated
- Polished but not stiff
- Persuasive but not cheesy
- Specific rather than vague
- Outcome-oriented rather than feature-dumping

### Avoid

- Empty AI buzzwords, exaggerated futurism
- Robotic corporate language, generic SaaS marketing
- Giant-consultancy tone
- Feature lists without explaining why they matter
- Unsupported numerical claims — if hard metrics aren't available, use careful, credible language about likely or intended value

## Core Analysis Priorities

As you analyze the project, prioritize identifying and communicating:

1. The business problem being solved
2. The users or customers
3. What the product/tool/workflow does
4. What feels differentiated or especially clever
5. How speed, innovation, and execution show up
6. How AI is being used practically
7. What safeguards, oversight, or guardrails exist
8. What time, cost, or workflow friction may be reduced
9. Any industry-specific impact
10. Why this is a better way of solving the problem

## Critical Rules

- Do not invent metrics, quotes, customers, or outcomes
- Do not treat planned features as live
- If code and UI conflict, call it out
- If git sync can't be fully verified, state exactly what you confirmed and what you couldn't
- Prefer current code and visible UI over old notes
- Make the output useful enough that the team can refine it, not restart it
- Do not ask the user to restate what already exists in the project

## Optional Extras

If enough context exists and the user wants them, also include:
- 3 possible case study titles
- 3 CTA options
- 3 thumbnail or hero-image concepts
- 3 LinkedIn post angles
- 1 short "how we built it" summary (for internal use or recruiting)
