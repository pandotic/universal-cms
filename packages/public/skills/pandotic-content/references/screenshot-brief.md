# Screenshot Capture Brief — Specification

This section of the output must be tailored to the specific project based on what was found in Phase 1 and Phase 2. It should read like a targeted operations brief that anyone (or any tool — Claude Chrome, Puppeteer, a human with a browser) can execute. Not a generic recommendation list.

---

## A. Pre-Capture Verification

Instructions to:
- Confirm it is looking at the latest available code/build
- Verify the current environment or deployed version
- Note any uncertainty about branch or freshness
- Prefer the running product over stale docs if they differ

## B. Capture Priorities

List the exact pages, flows, modules, and screens to prioritize based on what is actually implemented.

For each recommended screen:
- **Page or flow name**
- **What step/state to capture** (e.g., "after uploading a file", "with 3 flashcards visible")
- **What business story it helps tell** (e.g., "shows AI-generated study content from raw homework photos")
- **Suitable for:** website / case study / deck / video / internal-only

## C. Shot-by-Shot Instructions

Provide a specific shot list. For each shot:

| Field | Description |
|-------|-------------|
| **Filename** | Recommended filename (e.g., `study-guide-generated.png`) |
| **What to open** | URL path or page name |
| **Pre-capture actions** | What to click, expand, or interact with before capture |
| **Capture type** | Full-page, cropped, or focused on a specific element |
| **What to emphasize** | The key visual story (e.g., "the AI-generated content quality") |
| **What to avoid** | Unfinished elements, sensitive data, placeholder text |
| **Usage** | Public-safe or internal-only |

## D. Capture Quality Rules

Give Claude Chrome these standing rules:
- Avoid broken or placeholder states
- Avoid exposing secrets, API keys, or non-public data
- Use realistic, non-sensitive data in all captures
- Prefer readable, well-populated screens
- Capture the most visually compelling working states
- Note if a page should be skipped until polished
- Use consistent viewport size across captures
- Prefer light mode unless dark mode is a selling point

## E. Marketing Readiness Flags

Watch for before capturing public-facing assets:
- Incomplete UI or partially loaded states
- Placeholder text ("Lorem ipsum", "TODO", "Coming soon")
- Fake or obviously test metrics
- Misleading labels or broken navigation
- Broken buttons or dead links
- Outdated branding or old logos
- Internal terminology that would confuse external audiences
- Sensitive data exposure (emails, names, credentials)
- Console errors visible in the UI
- Loading spinners or skeleton states

## F. Top 5 Must-Have Captures

Choose the five highest-priority screenshots for this specific project.

For each:
- **What to capture** — specific page and state
- **Why this matters** — what story it tells for marketing
- **Where to use it** — website hero, case study inline, deck slide, video b-roll
- **Risk factors** — anything that could make this shot look bad

These five shots should be enough to tell the core product story if nothing else gets captured.
