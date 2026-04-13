# Codebase Analysis Algorithm

Step-by-step procedure for discovering architecture components. Run steps in parallel where possible.

## Step 1: Identify Framework & Stack

```
Read: package.json → dependencies, devDependencies
Read: next.config.*, vite.config.*, tsconfig.json
Read: .env.example or .env.local (variable names only, never values)
Read: netlify.toml, vercel.json, Dockerfile (deployment target)
```

Determine: Next.js vs Vite vs CRA vs Remix, TypeScript vs JavaScript, CSS framework

## Step 2: Discover Frontend Pages

```
Glob: src/app/**/page.tsx (Next.js App Router)
Glob: src/pages/**/*.tsx (Next.js Pages Router / Vite)
Glob: src/routes/**/*.tsx (Remix / other)
Glob: src/app/**/layout.tsx (layouts)
```

For each page: read first 30 lines to understand what it renders, count imports.

## Step 3: Discover Components

```
Glob: src/components/**/*.tsx
```

Group by directory (e.g., `player/`, `settings/`, `ui/`). Count files per group.
Identify major component groups (>3 files = likely a node).

## Step 4: Discover Hooks & State

```
Grep: "export function use" or "export const use" in src/**/*.ts
Grep: "create(" in src/store/** or src/lib/** (Zustand)
Grep: "createContext" in src/**/*.tsx
Grep: "createSlice" or "configureStore" (Redux)
```

Group hooks by domain. Count total hooks.

## Step 5: Discover API Routes

```
Glob: src/app/api/**/route.ts (Next.js App Router)
Glob: pages/api/**/*.ts (Pages Router)
Glob: supabase/functions/**/*.ts (Edge Functions)
```

For each route: read to identify what external services it calls (OpenAI, Supabase, etc.)

## Step 6: Discover AI Infrastructure

```
Grep: "openai" or "OpenAI" in src/**/*.ts
Grep: "anthropic" or "Anthropic" in src/**/*.ts
Grep: "elevenlabs" or "ElevenLabs" in src/**/*.ts
Grep: "deepgram" or "Deepgram" in src/**/*.ts
Grep: "systemPrompt" or "system:" or "role.*system" in src/**/*.ts
Grep: "guardrail" or "GUARDRAIL" in src/**/*.ts
```

Identify: LLM providers, prompt engineering patterns, guardrails, TTS/STT.

## Step 7: Discover Database

```
Glob: supabase/migrations/**/*.sql
Grep: "supabase.from(" in src/**/*.ts → extract table names
Grep: "prisma." in src/**/*.ts → extract model names
Grep: ".select(" or ".insert(" or ".update(" in src/**/*.ts
Read: prisma/schema.prisma or drizzle schema if exists
```

Count tables, identify RLS policies, map which routes query which tables.

## Step 8: Discover Data Pipeline

```
Glob: src/data/**/*
Glob: scripts/**/*
Grep: "nflverse" or "nfl" in scripts/**
Grep: "pipeline" or "etl" or "sync" in src/**/*.ts
```

Identify: data sources, transformation scripts, static data files.

## Step 9: Discover External Services

From .env.example or .env.local variable names:
- `OPENAI_*` → OpenAI
- `SUPABASE_*` → Supabase
- `ELEVENLABS_*` → ElevenLabs
- `DEEPGRAM_*` → Deepgram
- `STRIPE_*` → Stripe
- `NEXT_PUBLIC_*` → Client-side configs
- Deployment: Netlify/Vercel/AWS from config files

## Step 10: Map Connections

For each node discovered, trace its dependencies:
1. **Imports**: What does it import from other layers?
2. **API calls**: What fetch/axios calls does it make?
3. **DB queries**: What tables does it read/write?
4. **External calls**: What third-party APIs does it hit?

### Connection type selection:
- Component → Component: `uses`
- Component → Hook: `uses`
- Hook → API route: `http`
- API route → External API: `calls`
- API route → Database: `query`
- API route → AI service: `calls`
- Auth middleware → Route: `protects`
- CI/CD → Deploy target: `deploys`
- Pipeline → Database: `produces`
- Event → Handler: `triggers`

## Output

Generate the data file with:
- 25-40 nodes (fewer for small projects, more for large)
- 1.5-2x connections per node
- Every node has at least 1 connection
- Accurate file counts and LOC estimates
- Real file paths in keyFiles
- Descriptive keyFunctionality bullets
