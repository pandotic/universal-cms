# Phase 1: Code and Product Inspection Checklist

Follow this checklist before writing any marketing content. The goal is to ground everything in the actual product state.

## A. Code / GitHub Sync Check

Determine and document:

- **Current branch** — what branch is checked out?
- **Recent commits** — last 5-10 commits that reveal feature or UI changes
- **Freshness** — is local ahead, behind, or potentially stale vs remote?
- **Recent UI/feature/copy changes** — anything that affects the product story?
- **Uncertainties** — anything you could not verify

## B. File Survey

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

## C. Product Inventory

For each major page, module, feature, or flow, record:

- **Name** — what is it called?
- **Purpose** — what does it do?
- **User value** — why does the user care?
- **Status** — one of: `live` / `partial` / `unclear` / `planned`
- **Marketing-ready?** — strong enough to feature in content?
- **Screenshot-worthy?** — visually compelling enough to capture?

## D. Product Experience Assessment

After the inventory, synthesize:

- What appears **strongest** right now?
- What appears most **differentiated**?
- What most clearly shows **AI value**?
- What most clearly shows **speed, workflow improvement, or business usefulness**?
- What appears **visually compelling**?
- What appears **unfinished, confusing, or not ready to highlight**?

## E. Conflict Resolution

- If code says one thing and old docs say another → **trust the code**
- If a feature is in the code but not visible in the UI → mark as `partial`
- If a feature is referenced in docs but not in the code → mark as `planned`
- Note all conflicts in the output so the team can verify
