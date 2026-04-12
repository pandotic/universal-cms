# Output Sections — Complete Template

Produce all 16 sections below with clear headers. The content should communicate what was built, what problem it solves, what's unique, what's most powerful, and what capabilities are extensible to other projects.

---

## 1. What I Believe This Project Is

Start here to confirm understanding before the team uses any content.

Include:
- Product/project name
- What it appears to do
- Who it appears to serve
- The business problem it solves
- What is notable about it
- What Pandotic's role appears to be
- The most important assumptions you are making
- Any git/code-state caveats that affect confidence

This is a sanity check — get alignment before writing 12 more sections of content.

---

## 2. Current Code and Product-State Review

### A. Code / GitHub Sync Check
- Current branch
- Recent relevant commits or file changes
- Whether the project appears current
- Any risk that the local version is stale
- Uncertainties you could not verify

### B. Current Product Inventory
For each major page, module, feature, or flow:
- Name, purpose, user value
- Status: `live` / `partial` / `unclear` / `planned`
- Whether it is strong enough to feature in marketing
- Whether it is screenshot-worthy

### C. Current Product Experience Notes
- What appears strongest right now
- What appears most differentiated
- What most clearly shows AI value
- What most clearly shows speed, workflow improvement, or business usefulness
- What appears visually compelling
- What appears unfinished, confusing, or not ready to highlight

---

## 3. Website Case Study Draft

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

The case study should tell a story: problem → insight → solution → impact. Tie capabilities to business outcomes, not just technical features. Highlight what is extensible or reusable where relevant.

---

## 4. Short Portfolio Version

For a portfolio grid or project list page.

- 1 headline
- 1 short paragraph (2-3 sentences)
- 3 value-oriented bullet points (outcomes, not features)

---

## 5. Homepage / Sales Blurbs

Write:
- **Homepage blurb** — 40-60 words, punchy
- **Medium portfolio blurb** — 80-120 words, more detail
- **Sales-oriented blurb** — emphasize speed, innovation, practical AI, safety
- **3 alternate short taglines** — varied angles

---

## 6. 1-2 Minute Video Script

Natural, founder-friendly. Should sound like a real person speaking, not a corporate narrator.

Structure:
1. Opening hook (grab attention with the problem or insight)
2. The business problem (relatable, specific)
3. What we built (clear, visual language)
4. What makes it smarter or better (the "aha")
5. How AI was used responsibly (guardrails, oversight)
6. Business value / impact (credible outcomes)
7. Closing statement (memorable, forward-looking)

---

## 7. 30-Second Video Script

Shorter cut for promo, homepage video, or social. Same voice, tighter structure. Should work as a standalone piece.

---

## 8. Standout Features Section

Highlight the most compelling features or capabilities — the things that make someone say "that's clever."

For each one:
- What it does
- Why it matters to users
- Why it matters to the business
- Whether it feels differentiated
- Whether this capability is extensible to other projects

Do not just list UI elements. Explain why each feature exists and what problem it solves.

---

## 9. Secret Sauce / Internal Capability Notes

**Internal-only** — not for public content. This documents the reusable Pandotic capabilities behind the project, with a technical lens on what makes the approach unique and powerful.

### A. Technical Capability Inventory

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

### B. Architecture Decisions Worth Noting

Call out decisions that reflect Pandotic's thinking — not just what was built, but why it was built this way. These are the things that would impress a technical evaluator or a CTO reviewing the work.

---

## 10. Extensible Capabilities — What Else Could This Solve?

**Internal-only** — this is the strategic section. Take each capability identified in Section 9 and map it forward: where else could this pattern be applied? What other clients, industries, and use cases would benefit?

The goal is to build Pandotic's internal playbook — to recognize that a project built for one client often contains 3-5 capabilities that could be reshaped for completely different contexts.

### For Each Major Capability, Provide:

- **Capability name** — short, reusable label (e.g., "AI-powered document intake pipeline", "adaptive difficulty engine", "subject-aware prompt routing")
- **What it does in this project** — 1 sentence grounding it in the current build
- **What's generalizable** — strip away the project-specific details. What's the abstract pattern?
- **3-5 other use cases** — specific, concrete applications in other industries or client types. Not vague ("could be used in healthcare") — specific ("intake and triage of patient discharge summaries for post-acute care coordinators")
- **Client types who would pay for this** — who has this problem and budget?
- **What it would take to adapt** — is this a weekend of config changes, or a rebuild? Be honest about the gap between "we built something like this" and "we could ship this to a new client"
- **Engagement angle** — how would Pandotic pitch this? Workshop? Prototype sprint? Full build? Bolt-on to an existing system?

### Synthesis: Pandotic Capability Map

After mapping individual capabilities, write a short synthesis:
- Which capabilities cluster together into a coherent offering?
- What's the strongest "we've already built this" story Pandotic can tell?
- What types of engagements does this project best support as a reference?
- Are there capability gaps that would unlock more value if filled?

---

## 11. Reusable Proof Points

Write 8-12 short, modular proof points for use in:
- Proposals and pitch decks
- Service and capability pages
- LinkedIn posts
- Sales collateral

Each should be:
- 1-2 sentences
- Credible and outcome-oriented
- Specific enough to be convincing
- Free of unsupported hard-number claims

Example format: "Built [capability] that [outcome] for [user type], using [approach] to [business result]."

---

## 12. Technical Differentiators — Outward-Facing

Bridge between the internal capability notes (Sections 9-10) and the public-facing content. Write 3-5 short paragraphs that translate the technical "secret sauce" into language suitable for:
- A CTO or VP Engineering evaluating Pandotic as a partner
- A pitch deck slide about technical approach
- A proposal's "why us" section

Each paragraph should explain a technical choice or architectural pattern in plain language that communicates competence without jargon-dumping. Focus on outcomes: "We designed the system so that [business result], which means [stakeholder benefit]."

---

## 13. Claude Chrome Screenshot Brief

> **Note:** The full screenshot brief spec is now inlined in SKILL.md Phase 4, Section 13. See the main skill file for the complete capture brief template including pre-capture verification, capture priorities, shot-by-shot instructions, quality rules, marketing readiness flags, and top 5 must-have captures.

---

## 14. Links / Demo / Access Notes

Pull into a clean section:
- Live URL
- Staging URL
- Demo URL
- Login steps
- Demo credentials
- Notes on what can or cannot be shared publicly

If unavailable, say so clearly — don't skip the section.

---

## 15. Missing Info / Follow-Up Gaps

List the highest-value missing inputs that would improve the final assets:
- Measurable outcomes or usage data
- Screenshots not yet captured
- Customer or user quotes
- Rollout or adoption results
- Guardrail details not visible in code
- Demo access or cleaner sample data
- Anything that would make the content more credible

Do not stall because these are missing. Produce the best grounded draft first, then list gaps.

---

## 16. One-Page Product Landing Page

Write a complete, structured one-page product landing page for use at `pandotic.ai/<project-slug>`. This page synthesizes the best content from other sections into a single compelling page that can be loaded into a CMS.

This is saved as `product-page.md` in the output directory.

### YAML Frontmatter

Every product page starts with CMS-ready frontmatter:

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

- If the project has its own website, set `own_site_url` and make the primary CTA link there.
- If it's demo-only, set `has_live_demo: true` with the demo URL, or `false` if there's no public demo yet.

### Page Structure

#### Hero Section
- **Headline** — the single most compelling statement about what this product does (draw from Section 3 headline or Section 5 taglines)
- **Subheadline** — 1-2 sentences expanding the headline
- **Screenshot placeholder** — reference the top-priority screenshot from Section 13: `![Hero screenshot](screenshots/<filename>)`
- **Primary CTA** — adapt based on project state:
  - Has its own site: "Visit <project-name>" linking to `own_site_url`
  - Has a live demo: "Try the demo" linking to `demo_url`
  - No public access yet: "Learn more" or "Get in touch"

#### What It Solves
- 2-3 short paragraphs describing the problem and who has it
- Draw from the Challenge section of the case study (Section 3) but make it punchier and more direct
- End with a clear transition into the solution

#### How It Works
- 3-5 key capabilities, each with:
  - A short bold title
  - 1-2 sentence description focused on user value
- Draw from Section 8 (Standout Features) — pick the strongest ones
- Use outcome-oriented language, not feature-dumping

#### Video Section
- Embed placeholder for the video: `{{video-embed: <project-slug>-long}}`
- Below it, a 1-sentence description of what the viewer will see
- If the 30-second version is more appropriate for the page context, use `{{video-embed: <project-slug>-short}}` instead and note it
- These videos are produced from the scripts in Sections 6 and 7 — the landing page is where they live

#### Why It's Different
- 2-3 short paragraphs drawing from Section 12 (Technical Differentiators) and the "Why It Works Better" part of Section 3
- Translate technical strengths into business language

#### Proof Points
- Select the 4-6 strongest proof points from Section 11
- Format as a visual grid or short bullet list

#### About Pandotic (Footer Context)
- 2-3 sentences about Pandotic's role — draw from Section 3's "Pandotic's Role" subsection
- Soft CTA: "Want to build something like this? Let's talk."
- Link placeholder: `{{contact-link}}`

### Rules for This Section
- This page must stand completely on its own — a reader who sees nothing else should understand the product
- Do not reference other sections ("as mentioned in the case study") — synthesize the content directly
- Prefer the most concrete, specific content available
- Keep the total length to roughly 600-900 words of body content (excluding frontmatter)
- The page will live at `pandotic.ai/<project-slug>` (e.g., `pandotic.ai/thankbetter`) — write it for that context

---

## Optional Extras

If enough context exists, also include:
- 3 possible case study titles
- 3 CTA options
- 3 thumbnail or hero-image concepts
- 3 LinkedIn post angles
- 1 short "how we built it" summary (for internal use or recruiting)
