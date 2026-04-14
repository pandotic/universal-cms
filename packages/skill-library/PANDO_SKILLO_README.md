# Skills Store

A skills library and marketplace for Claude. Browse skills in a web UI, install them via CLI, or deploy to any repo via GitHub PR.

```
pando-skillo/
├── skills/                     <- skill definitions (source of truth)
│   ├── docx/SKILL.md
│   ├── pdf/SKILL.md
│   ├── xlsx/SKILL.md
│   ├── pptx/SKILL.md
│   ├── mindpal/SKILL.md
│   ├── skill-creator/SKILL.md
│   ├── schedule/SKILL.md
│   ├── ui-kit/SKILL.md         <- teaches Claude your design system
│   └── _template/SKILL.md     <- scaffold for new skills
├── components/                 <- reusable code (installed with companion skills)
│   ├── modal/Modal.jsx
│   ├── card/Card.jsx
│   ├── search-input/SearchInput.jsx
│   ├── tabs/Tabs.jsx
│   ├── copy-block/CopyBlock.jsx
│   └── badge/Badge.jsx
├── skills-manifest.json        <- registry with metadata
├── bin/cli.cjs                 <- CLI tool
├── src/                        <- Vite React app (componentized)
├── public/index.html           <- CDN fallback (standalone SPA)
├── netlify/functions/          <- OAuth token exchange
└── scripts/                    <- validation + sync utilities
```

---

## Quick Start: Install a Skill

### Option 1: CLI (recommended)

```bash
# Install to current project
npx pando-skillo add docx pdf xlsx

# Install globally (all your projects)
npx pando-skillo add docx --global

# Install everything
npx pando-skillo add --all

# List available skills
npx pando-skillo list
```

### Option 2: One-liner (no install)

```bash
# Download a single skill directly
curl -sL "https://raw.githubusercontent.com/pandotic/pando-skillo/main/skills/docx/SKILL.md" \
  -o .claude/skills/docx/SKILL.md --create-dirs
```

### Option 3: Web UI + PR

Visit the Skills Store web app, select skills, choose a target repo, and create a pull request.

### Option 4: Manual download

Download SKILL.md from the web UI detail modal and place it wherever you need it.

---

## Skills vs Components

This repo holds two types of things:

| | Skills | Components |
|---|---|---|
| **What** | Markdown instructions for Claude | Reusable code (React, JSX, CSS) |
| **Who reads it** | Claude (AI) | Developers / Claude when building |
| **Format** | `SKILL.md` with YAML frontmatter | `.jsx`, `.tsx`, `.css` files |
| **Installed to** | `.claude/skills/` | `components/` in your project |
| **Purpose** | Teach Claude *when and how* to do something | Give Claude *actual code* to use |

**The power move:** A skill + components together. The `ui-kit` skill teaches Claude your design system (colors, spacing, patterns), and the companion components give it actual code to import. When someone says "build me a settings page," Claude knows your conventions AND has real components to assemble.

```bash
# Install the ui-kit skill + all 6 components in one command
npx pando-skillo add ui-kit

# Result:
# .claude/skills/ui-kit/SKILL.md     <- Claude's design system knowledge
# components/modal/Modal.jsx          <- Actual Modal component
# components/card/Card.jsx            <- Actual Card component
# components/tabs/Tabs.jsx            <- ... and so on
```

---

## Understanding Skill Types & Scopes

Skills are markdown files (SKILL.md) with YAML frontmatter that teach Claude new capabilities. They work across different platforms and scopes:

### Where Skills Can Live

| Scope | Location | Who Gets It | Best For |
|-------|----------|-------------|----------|
| **Project** | `.claude/skills/<name>/SKILL.md` | Anyone who clones the repo | Team skills, project-specific workflows |
| **User (global)** | `~/.claude/skills/<name>/SKILL.md` | You, in all your projects | Personal productivity skills |
| **Enterprise** | Admin-managed settings | Everyone in your org | Org-wide standards and processes |
| **Claude.ai** | Settings > Skills (upload) | You, in web chat | Browser-based conversations |

### How Each Platform Works

**Claude Code** (CLI, Desktop, claude.ai/code)
- Skills are auto-discovered from `.claude/skills/` in your project and `~/.claude/skills/` globally
- Claude reads the `description` field to decide when to activate a skill
- Skills can be invoked explicitly with `/skill-name` or triggered automatically
- Supports nested discovery in monorepos (each package can have its own skills)

**Claude.ai** (Web Chat at claude.ai)
- Go to Settings > Skills and upload a SKILL.md file
- Skills work within browser-based conversations
- Each user uploads individually (not shared via git)
- Download from this Skills Store using the "Download SKILL.md" button

**Both platforms** follow the [Agent Skills](https://agentskills.io) open standard for skill format.

### Skill Format

Every skill is a single markdown file:

```yaml
---
name: my-skill
version: "1.0.0"
description: "When to trigger and what the skill does"
---

# My Skill

Instructions for Claude...
```

The `description` field is critical — it's what Claude reads to decide whether to use the skill. Be specific about triggers: mention file extensions, keywords, and user intents.

---

## Ways to Share Skills

### 1. Git (team sharing)
Add skills to `.claude/skills/` in any repo. Everyone who clones gets them automatically.

```bash
# From your project root
npx pando-skillo add docx pdf
git add .claude/skills/
git commit -m "Add document skills"
git push
```

### 2. PR Deploy (cross-repo)
Use the Skills Store web UI to create a PR that adds skills to any repo you have push access to. Great for deploying skills to multiple team repos.

### 3. Global Install (personal)
Install skills to `~/.claude/skills/` so they're available in every project without polluting repos.

```bash
npx pando-skillo add --all --global
```

### 4. Direct Download (claude.ai)
Click any skill in the web UI, go to "Install & Share" tab, and download the SKILL.md file. Upload it to claude.ai > Settings > Skills.

### 5. Curl / Script (CI/automation)
Use the raw GitHub URL to fetch skills programmatically:

```bash
# Single skill
curl -sL "https://raw.githubusercontent.com/pandotic/pando-skillo/main/skills/docx/SKILL.md" \
  -o .claude/skills/docx/SKILL.md --create-dirs

# All skills via CLI
npx pando-skillo add --all --dir /path/to/project
```

### 6. Fork & Customize
Fork this repo, add your own skills, and point the web UI at your fork. Your team gets a private skills marketplace.

---

## Adding a New Skill

1. Copy the template:
   ```bash
   cp -r skills/_template skills/my-skill
   ```

2. Edit `skills/my-skill/SKILL.md` with your skill's content

3. Add an entry to `skills-manifest.json`:
   ```json
   {
     "id": "my-skill",
     "name": "My Skill",
     "icon": "Wrench",
     "category": "Developer Tools",
     "description": "Short description for the card",
     "triggers": ["keyword1", "keyword2"],
     "version": "1.0.0",
     "path": "skills/my-skill"
   }
   ```

4. Validate and sync:
   ```bash
   npm run validate   # Check manifest matches skill directories
   npm run sync       # Copy to public/ for local dev
   ```

5. Commit and push. The store updates automatically.

**Available icons:** `FileText`, `FileCheck`, `Presentation`, `Table`, `Bot`, `Wrench`, `Clock`, `Package`

**Available categories:** `Documents`, `AI & Automation`, `Developer Tools`

---

## Development

```bash
npm install            # Install dependencies
npm run dev            # Vite dev server (componentized app)
npm run dev:netlify    # Netlify dev server (with serverless functions)
npm run build          # Sync + Vite production build
npm run validate       # Check manifest <-> skill directory consistency
npm run sync           # Copy skills + manifest to public/
```

### Setup for Deployment

1. **Create a GitHub OAuth App** at [github.com/settings/developers](https://github.com/settings/developers):
   - Homepage URL: Your Netlify URL
   - Callback URL: Same as Homepage URL

2. **Deploy to Netlify:**
   ```bash
   netlify env:set GITHUB_CLIENT_ID     "your_client_id"
   netlify env:set GITHUB_CLIENT_SECRET "your_client_secret"
   netlify deploy --prod
   ```

---

## Architecture

- **Frontend (Vite):** `src/` — React 18 + Tailwind, componentized, builds to `dist/`
- **Frontend (CDN fallback):** `public/index.html` — standalone SPA, no build step
- **Backend:** `netlify/functions/github-auth.js` — OAuth token exchange only
- **Skills:** `skills/<id>/SKILL.md` — markdown with YAML frontmatter
- **Registry:** `skills-manifest.json` — single source of truth
- **CLI:** `bin/cli.cjs` — Node.js CLI for terminal installation
- **Deployment:** Netlify (static + serverless functions)
