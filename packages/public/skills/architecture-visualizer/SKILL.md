---
name: architecture-visualizer
description: |
  Generate interactive architecture visualizations for any project.
  Use when asked about: architecture diagram, system architecture, codebase visualization,
  architecture page, architecture dashboard, architecture map, system map,
  data flow visualization, component dependency graph, service map,
  or any request to visualize how a project's pieces connect.
  Also use when the user says "architecture-visualizer" or asks to
  "map out the architecture" or "show how everything connects."
user-invocable: true
---

# Architecture Visualizer

Generate a fully interactive architecture visualization for the current project. Produces two files:
1. **Data file** — typed nodes, connections, and layer config
2. **Component file** — interactive React component with SVG connection lines, clickable cards, flyout details, filters

## Phase 1: Codebase Analysis

Scan the codebase to discover all architectural components. Run these searches IN PARALLEL using multiple Explore agents:

### Agent 1: Frontend + State
- Glob for page/route files: `src/app/**/page.tsx`, `src/pages/**/*.tsx`, `src/routes/**/*.tsx`
- Glob for components: `src/components/**/*.tsx`
- Grep for state management: `create(` (Zustand), `createContext`, `createStore`, `configureStore`
- Grep for hooks: `export function use`, `export const use`
- Count files and estimate LOC per group

### Agent 2: API + AI + External
- Glob for API routes: `src/app/api/**/route.ts`, `src/api/**/*.ts`, `pages/api/**/*.ts`
- Grep for external API calls: `fetch(`, `axios`, `openai`, `anthropic`, `elevenlabs`, `deepgram`, `stripe`
- Grep for AI/LLM usage: `ChatCompletion`, `generateText`, `streamText`, `completion`
- Grep for auth: `supabase.auth`, `NextAuth`, `clerk`, `auth0`
- Read key config files: `.env.local`, `.env.example`, `next.config`, `vite.config`

### Agent 3: Data + Database + Infrastructure
- Glob for DB schemas/migrations: `supabase/migrations/**/*.sql`, `prisma/schema.prisma`, `drizzle/**/*.ts`
- Grep for DB queries: `supabase.from(`, `.select(`, `prisma.`, `db.query`
- Glob for data files: `src/data/**/*`, `src/lib/data/**/*`
- Read deployment config: `netlify.toml`, `vercel.json`, `Dockerfile`, `.github/workflows/**`
- Check for pipeline/ETL scripts: `scripts/**/*`, `src/lib/pipeline*`

## Phase 2: Categorize into Layers

Use these default layers (customize based on what was discovered):

@layer-presets.md

## Phase 3: Generate Data File

Create a data file following this schema:

@data-schema.md

### Node Guidelines
- **id**: Use layer prefix + short name: `fe-shell`, `api-ai-briefing`, `db-supabase`, `ext-openai`
- **tech**: Short stack label: `React 18 · TSX`, `Next.js Route Handler`, `PostgreSQL · RLS`
- **description**: 2-3 sentences explaining what this component does and why it matters
- **keyFiles**: List the 1-5 most important files (relative paths)
- **keyFunctionality**: 3-6 bullet points of what it does
- **fileCount**: Actual count from Glob results
- **linesOfCode**: Estimate from file sizes, use `~N` prefix for estimates

### Connection Guidelines
- Every node should have at least 1 connection (isolated nodes = missed dependency)
- Use specific labels: `POST /api/ai/briefing`, `supabase.from('roster')`, `OpenAI gpt-4o`
- Connection types: `uses`, `calls`, `reads`, `http`, `query`, `auth`, `sends`, `protects`, `hosts`, `deploys`, `produces`, `triggers`
- Aim for 1.5-2x connections per node (30 nodes → 45-60 connections)

## Phase 4: Generate Component

Build the interactive visualization component:

@component-template.md

### Component Requirements
- **Light + dark mode** via CSS custom properties scoped to `data-hiw-mode` attribute (see component-template.md for full token set)
- **Tailwind CSS** with `var(--hiw-*)` tokens (no hardcoded colors — all theme-aware)
- **No extra dependencies** — inline SVG icons, no Lucide/Heroicons import
- **Mobile responsive** — stack layers vertically, hide flyout on mobile (use modal)
- **SVG Bezier connections** — dynamic routing via `getBoundingClientRect` + `ResizeObserver`
- **Smart connection routing** — three routing strategies based on node position:
  1. **Same layer, different columns** (horizontal): Bezier curve from right edge → left edge (or vice versa) with `CURVE_INTENSITY` downward bow
  2. **Same layer, same column** (vertically stacked): U-shaped 180° curve that exits and re-enters on the SAME side (away from container center). Never draw horizontal lines through other cards.
  3. **Different layers** (vertical): Bezier from bottom edge → top edge with `CP_OFFSET` control points
- **Same-column detection**: `horizontalOverlap > cardWidth * 0.3` means cards share a column
- **U-curve direction**: curve away from container center (`fCx < containerWidth / 2` → curve right, else curve left)
- **Extract path calculation** into a shared utility (`calcConnectionPath.ts`) — never duplicate across components
- **CRITICAL: containerRef on the `relative` div** — the ref used for coordinate calculations MUST be on the same element the SVG is positioned relative to (see component-template.md for details)
- **Flyout detail panel** — 340px right panel with tech specs, key files, connections
- **Filters** — layer filter chips, connection type filter, card/compact toggle, line toggle
- **Hover highlighting** — dim unrelated connections (opacity 0.01), animate active ones (opacity 0.85)
- **Idle lines very dim** — base opacity 0.06 so they don't overwhelm the card grid
- **Dual-timeout line recalculation** — 150ms + 700ms to account for archFadeIn animation transforms
- **Keyboard** — Escape closes flyout

## Phase 5: Wire into App

- Import the component into the appropriate settings/dashboard page
- Add navigation link/tab if needed
- Ensure the route is accessible from the main navigation

## Phase 6: Verify

1. `npm run build` / `pnpm build` passes
2. All layers render with correct colors in **both light and dark mode**
3. Connection lines draw between **correct nodes** — verify by comparing path endpoints to card `getBoundingClientRect()` positions
4. Clicking a node opens flyout with accurate details
5. Layer filter hides/shows correct nodes + connections
6. Connection type filter works
7. Card/compact toggle works
8. Hover highlighting dims unrelated connections, brightens active ones
9. **Idle lines are very dim** (opacity ~0.06), not distracting
10. Mobile layout stacks properly, lines hidden on mobile
11. Escape key closes flyout
12. Light/dark toggle switches all theme tokens correctly
13. Lines recalculate correctly after initial page load (dual-timeout working)
