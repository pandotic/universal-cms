# API Central — Standalone Module

A self-contained API service, secrets, and project budget tracker. Drop into any React + Supabase + Netlify Functions project.

## What's Included

```
api-central/
├── src/
│   ├── APICentral.tsx        # Main page component (self-contained)
│   ├── types/api-central.ts  # All TypeScript interfaces
│   ├── lib/auth.ts           # Auth helpers (token, headers)
│   └── lib/logger.ts         # Logger utility
├── backend/
│   ├── api-central.ts        # Netlify Function (full CRUD + stats)
│   ├── auth.ts               # Auth function (login + token refresh)
│   └── lib/
│       ├── supabase.ts       # Supabase PostgREST helper
│       └── auth-middleware.ts # HMAC token auth middleware
├── sql/
│   └── setup.sql             # Supabase migration (3 tables + RLS)
└── README.md
```

## Setup

### 1. Database (Supabase)

Run `sql/setup.sql` against your Supabase project:

```bash
# Via Supabase dashboard: SQL Editor → paste contents of sql/setup.sql
# Or via CLI:
supabase db push
```

### 2. Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
APP_PASSWORD=your-app-password

# Frontend (optional)
VITE_API_BASE=/.netlify/functions   # default
```

### 3. Copy Files

**Backend** — copy into your `netlify/functions/` directory:
```bash
cp backend/api-central.ts    YOUR_PROJECT/netlify/functions/
cp backend/auth.ts           YOUR_PROJECT/netlify/functions/
cp -r backend/lib/           YOUR_PROJECT/netlify/functions/lib/
```

**Frontend** — copy into your `src/` directory:
```bash
cp src/APICentral.tsx         YOUR_PROJECT/src/pages/
cp src/types/api-central.ts   YOUR_PROJECT/src/types/
cp src/lib/auth.ts            YOUR_PROJECT/src/lib/
cp src/lib/logger.ts          YOUR_PROJECT/src/lib/
```

### 4. Add Route

```tsx
import { APICentral } from '@/pages/APICentral'

// In your router:
<Route path="/api-central" element={<APICentral />} />
```

### 5. API Config

Add to your API config file:

```ts
const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'

export const API = {
  apiServices: (id?: string) => id ? `${API_BASE}/api-central/services/${id}` : `${API_BASE}/api-central/services`,
  apiSecrets: (id?: string) => id ? `${API_BASE}/api-central/secrets/${id}` : `${API_BASE}/api-central/secrets`,
  apiProjects: `${API_BASE}/api-central/projects`,
  apiStats: `${API_BASE}/api-central/stats`,
}
```

## Dependencies

### Frontend (npm)
- `react` >= 18
- `lucide-react` (icons)
- shadcn-style UI components: `Card`, `Button`, `Badge`, `Input`, `Dialog`, `Toast`

### Backend (npm)
- `@netlify/functions`

### Services
- Supabase (PostgreSQL + PostgREST)
- Netlify Functions (serverless backend)

## Features

- **Services**: Full CRUD for API services with category, entity, budget, billing cycle, renewal dates
- **Secrets**: Encrypted secret storage with client-side AES-GCM encryption (PIN-protected), masked display, copy-to-clipboard
- **Projects**: Track which projects use which services
- **Dashboard**: Budget vs spend overview, over-budget alerts, upcoming renewal warnings, spend by entity/category
- **Quick Add**: Paste an API key and auto-detect the service from the key format
- **Tabs**: Dashboard / Quick Add / Services / Secrets / Spend

## Customization

Edit the constants at the top of `APICentral.tsx` to match your org:

```ts
const CATEGORIES = ['AI/LLM', 'Database', 'Hosting', 'Dev Tools', 'Observability', 'Payments', 'Other']
const ENTITIES = ['GBI', 'Pandotic', 'FireShield', 'Personal']
const STATUSES = ['active', 'inactive', 'trial', 'cancelled']
const LOGIN_METHODS = ['Google (personal)', 'Google (GBI)', 'GitHub', 'Email (personal)', 'Email (GBI)', 'SSO', 'Other']
const ENVS = ['production', 'staging', 'development', 'local']
```

## UI Component Requirements

The page expects these shadcn-style components. If your project doesn't have them, install via shadcn CLI or copy from a shadcn project:

```
@/components/ui/card      — Card, CardContent, CardHeader
@/components/ui/button    — Button
@/components/ui/badge     — Badge
@/components/ui/input     — Input
@/components/ui/dialog    — Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
@/components/ui/toast     — useToast
```
