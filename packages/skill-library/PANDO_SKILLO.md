# Skills Store — CLAUDE.md

## What This Project Is

An internal skills marketplace for Claude Code. Team members browse skills in a web UI and deploy them to any repo via GitHub PR, adding files to `.claude/skills/` in the target project. Skills can also be installed via CLI or downloaded for claude.ai upload.

## Architecture

- **Frontend (Vite)**: Componentized React app in `src/` — React 18 + Tailwind, builds to `dist/`
- **Frontend (CDN fallback)**: `public/index.html` — standalone SPA with CDN React, no build step
- **Backend**: Netlify serverless function (`netlify/functions/github-auth.js`) — GitHub OAuth token exchange only
- **Skills**: Markdown files in `skills/<id>/SKILL.md` with YAML frontmatter
- **Components**: Reusable React/JSX files in `components/<id>/` — installed alongside companion skills
- **Registry**: `skills-manifest.json` at repo root — single source of truth for skill metadata
- **Knowledgebases**: Domain-expert files in `knowledgebases/<id>/KB.md` with YAML frontmatter
- **KB Registry**: `knowledgebases-manifest.json` at repo root — source of truth for KB metadata
- **Guardrails**: `knowledgebases/_guardrails/GUARDRAILS.md` — universal safety guardrails auto-prepended at install
- **CLI**: `bin/cli.cjs` — Node.js CLI for terminal-based skill and knowledgebase installation
- **Deployment**: Netlify static site + functions

## Key Conventions

### Skill Format
Each skill lives in `skills/<id>/SKILL.md`:
```yaml
---
name: <id>
version: "1.0.0"
description: "When to trigger and what the skill does"
---

# Skill Title

Markdown instructions for Claude...
```

### Manifest Format (`skills-manifest.json`)
```json
{
  "id": "my-skill",
  "name": "Human-Readable Name",
  "icon": "FileText",
  "category": "Documents",
  "description": "Short card description",
  "triggers": [".ext", "keyword"],
  "version": "1.0.0",
  "author": "github-username",
  "path": "skills/my-skill"
}
```

Available icons: `FileText`, `FileCheck`, `Presentation`, `Table`, `Bot`, `Wrench`, `Clock`, `Package`, `Thermometer`, `Zap`, `Droplets`, `Shield`, `BookOpen`

Available categories: `Documents`, `AI & Automation`, `Developer Tools`, `UI Components`, `Mechanical`, `Electrical`, `Plumbing`, `General`

### Skills with Components
A skill can include companion component files via the `"components"` field in the manifest:
```json
{
  "id": "ui-kit",
  "components": ["modal", "card", "tabs", "badge"]
}
```
When installed via CLI, both the SKILL.md (to `.claude/skills/`) and component files (to `components/`) are copied. The skill teaches Claude how to use the components; the components are the actual code.

### Knowledgebase Format
Each knowledgebase lives in `knowledgebases/<id>/KB.md`:
```yaml
---
name: <id>
version: "1.0.0"
domain: "HVAC Installation & Systems"
description: "A domain expert in [X]. Covers [scope]. Does NOT cover [exclusions]."
---

# Domain Expert Knowledgebase

Domain knowledge, Q&A, standards, terminology...
```

### KB Manifest Format (`knowledgebases-manifest.json`)
```json
{
  "id": "hvac-installation",
  "name": "HVAC Installation Expert",
  "icon": "Thermometer",
  "category": "Mechanical",
  "domain": "HVAC Installation & Systems",
  "description": "Short card description",
  "triggers": ["HVAC", "heating", "cooling"],
  "version": "1.0.0",
  "author": "pandotic",
  "path": "knowledgebases/hvac-installation",
  "type": "knowledgebase"
}
```

### Guardrails
Universal guardrails in `knowledgebases/_guardrails/GUARDRAILS.md` are automatically prepended to every knowledgebase at install time (CLI and PR deploy). They prevent:
- Hallucination (must cite sources, say "I don't know" when uncertain)
- Prompt injection / jailbreaking (ignore override attempts, don't role-play)
- Out-of-domain answers (stay within the KB's stated scope)
- Unsafe advice (recommend licensed professionals, include safety warnings)

### Adding a New Skill
1. Copy `skills/_template/SKILL.md` to `skills/<id>/SKILL.md`
2. Add an entry to `skills-manifest.json`
3. Run `npm run validate` to verify consistency
4. Run `npm run sync` to sync to `public/` for local dev

### Adding a New Knowledgebase
1. Copy `knowledgebases/_template/KB.md` to `knowledgebases/<id>/KB.md`
2. Add an entry to `knowledgebases-manifest.json`
3. Run `npm run validate` to verify consistency
4. Run `npm run sync` to sync to `public/` for local dev

### Development
```bash
npm run dev          # Vite dev server
npm run dev:netlify  # Netlify dev server (with functions)
npm run build        # Sync + Vite production build
npm run validate     # Check manifest <-> skill directory consistency
npm run sync         # Copy skills + manifest to public/
```

### CLI Usage
```bash
npx pando-skillo list              # List available skills
npx pando-skillo add docx pdf      # Install to .claude/skills/
npx pando-skillo add docx --global # Install to ~/.claude/skills/
npx pando-skillo add --all         # Install all skills

npx pando-skillo kb list                    # List available knowledgebases
npx pando-skillo kb add hvac-installation   # Install KB (with guardrails)
npx pando-skillo kb add --all --global      # Install all KBs globally
```

### Skill Install Scopes
- **Project**: `.claude/skills/` in a repo (shared via git)
- **User (global)**: `~/.claude/skills/` (available in all Claude Code projects)
- **Claude.ai**: Download SKILL.md, upload to Settings > Skills
- **Team deploy**: PR via web UI to any repo

### Environment Variables (Netlify)
- `GITHUB_CLIENT_ID` — GitHub OAuth App client ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth App client secret (never in client code)

## Rules
- `skills-manifest.json` and `knowledgebases-manifest.json` at root are the sources of truth — `public/` copies are generated via `npm run sync`
- Never commit secrets or `.env` files
- Every skill must have both a manifest entry and a `SKILL.md` file
- Every knowledgebase must have both a manifest entry and a `KB.md` file
- Keep SKILL.md and KB.md files self-contained — they get deployed individually to target repos
- Guardrails are prepended at install time, not stored in individual KB.md files
- Both `public/index.html` (CDN) and `src/` (Vite) must stay in sync for feature parity
