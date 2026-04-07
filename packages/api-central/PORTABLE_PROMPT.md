# API Central — Drop-in Module

Build an "API Central" feature in this project. It tracks API services, secrets (with client-side encryption), and project budgets. Everything below is self-contained — create the files as specified.

## Stack requirements
- React 18+ with TypeScript
- Supabase (PostgREST)
- Netlify Functions (serverless backend)
- shadcn-style UI components (Card, Button, Badge, Input, Dialog, Toast)
- lucide-react icons
- Tailwind CSS

## Env vars needed
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
APP_PASSWORD=your-app-password
```

---

## FILE 1: sql/setup.sql
Run this against Supabase to create tables.

```sql
-- API Central: Services, Secrets, and Projects
-- Run this against your Supabase project to set up the required tables.

-- ─── API Services ────────────────────────────────────────────────────────────

create table if not exists api_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  category text default 'Other',
  entity text default 'Other',
  login_method text,
  monthly_budget numeric(10,2) default 0,
  current_spend numeric(10,2) default 0,
  billing_cycle text default 'monthly',
  renewal_date date,
  status text default 'active',
  notes text,
  projects text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── API Secrets ─────────────────────────────────────────────────────────────

create table if not exists api_secrets (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references api_services(id) on delete cascade,
  name text not null,
  value text not null,
  env text default 'production',
  last_rotated date,
  expires_at date,
  encrypted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Projects ────────────────────────────────────────────────────────────────

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity text,
  description text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_api_services_status on api_services(status);
create index if not exists idx_api_services_entity on api_services(entity);
create index if not exists idx_api_secrets_service on api_secrets(service_id);
create index if not exists idx_projects_active on projects(active);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Auth is handled at the Netlify Function layer, so we allow anon access
-- through PostgREST. If you want DB-level auth, replace these with
-- authenticated-only policies.

alter table api_services enable row level security;
alter table api_secrets enable row level security;
alter table projects enable row level security;

create policy "api_services_all" on api_services for all using (true) with check (true);
create policy "api_secrets_all" on api_secrets for all using (true) with check (true);
create policy "projects_all" on projects for all using (true) with check (true);
```

---

## FILE 2: netlify/functions/lib/supabase.ts

```typescript
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase error: ${response.status} - ${error}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
```

---

## FILE 3: netlify/functions/lib/auth-middleware.ts

```typescript
import type { HandlerEvent } from '@netlify/functions'
import { createHmac, randomBytes } from 'crypto'

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function getSecret(): string {
  const secret = process.env.APP_PASSWORD
  if (!secret) throw new Error('APP_PASSWORD not configured')
  return secret
}

export function generateToken(): string {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
    nonce: randomBytes(16).toString('hex'),
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function validateToken(token: string): boolean {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return false

    const expectedSig = createHmac('sha256', getSecret()).update(data).digest('base64url')
    if (sig !== expectedSig) return false

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (Date.now() > payload.exp) return false

    return true
  } catch {
    return false
  }
}

export function requireAuth(event: HandlerEvent): { statusCode: number; body: string } | null {
  const authHeader = event.headers['authorization'] || event.headers['Authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' }),
    }
  }

  const token = authHeader.slice(7)
  if (!validateToken(token)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    }
  }

  return null // Auth passed
}
```

---

## FILE 4: netlify/functions/auth.ts

```typescript
import type { Handler } from '@netlify/functions'
import { generateToken, validateToken } from './lib/auth-middleware'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const body = JSON.parse(event.body || '{}')

  // Token refresh endpoint
  if (body.action === 'refresh') {
    const authHeader = event.headers['authorization'] || event.headers['Authorization']
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token && validateToken(token)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, token: generateToken() }),
      }
    }
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    }
  }

  // Login endpoint
  const correctPassword = process.env.APP_PASSWORD
  if (!correctPassword) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'APP_PASSWORD not configured' }),
    }
  }

  if (body.password === correctPassword) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, token: generateToken() }),
    }
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'Invalid password' }),
  }
}

export { handler }
```

---

## FILE 5: netlify/functions/api-central.ts

```typescript
import type { Handler } from '@netlify/functions'
import { requireAuth } from './lib/auth-middleware'
import { supabaseRequest, isSupabaseConfigured } from './lib/supabase'

interface ApiService {
  id?: string
  name: string
  url?: string
  category?: string
  entity?: string
  login_method?: string
  monthly_budget?: number
  current_spend?: number
  billing_cycle?: string
  renewal_date?: string
  status?: string
  notes?: string
  projects?: string[]
}

interface ApiSecret {
  id?: string
  service_id: string
  name: string
  value: string
  env?: string
  last_rotated?: string
  expires_at?: string
  encrypted?: boolean
}

interface Project {
  id?: string
  name: string
  entity?: string
  description?: string
  active?: boolean
}

const handler: Handler = async (event) => {
  const authError = requireAuth(event)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase not configured' })
    }
  }

  const path = event.path.replace('/.netlify/functions/api-central', '')
  const parts = path.split('/').filter(Boolean)
  const resource = parts[0] // 'services', 'secrets', or 'stats'
  const resourceId = parts[1]

  try {
    // ─── SERVICES ─────────────────────────────────────────────────────

    // GET /api-central/services - List all services
    if (event.httpMethod === 'GET' && resource === 'services' && !resourceId) {
      const services = await supabaseRequest('api_services?order=name.asc')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services })
      }
    }

    // GET /api-central/services/:id - Get single service
    if (event.httpMethod === 'GET' && resource === 'services' && resourceId) {
      const services = await supabaseRequest(`api_services?id=eq.${resourceId}`)
      if (!services || services.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Service not found' }) }
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services[0])
      }
    }

    // POST /api-central/services - Create service
    if (event.httpMethod === 'POST' && resource === 'services') {
      const body: ApiService = JSON.parse(event.body || '{}')
      const created = await supabaseRequest('api_services', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Prefer': 'return=representation' }
      })
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created[0])
      }
    }

    // PATCH /api-central/services/:id - Update service
    if (event.httpMethod === 'PATCH' && resource === 'services' && resourceId) {
      const body: Partial<ApiService> = JSON.parse(event.body || '{}')
      body.updated_at = new Date().toISOString()
      await supabaseRequest(`api_services?id=eq.${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // DELETE /api-central/services/:id - Delete service (cascades to secrets)
    if (event.httpMethod === 'DELETE' && resource === 'services' && resourceId) {
      await supabaseRequest(`api_services?id=eq.${resourceId}`, {
        method: 'DELETE'
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // ─── SECRETS ──────────────────────────────────────────────────────

    // GET /api-central/secrets - List all secrets
    if (event.httpMethod === 'GET' && resource === 'secrets' && !resourceId) {
      const secrets = await supabaseRequest('api_secrets?order=name.asc')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secrets })
      }
    }

    // GET /api-central/secrets/:id - Get single secret
    if (event.httpMethod === 'GET' && resource === 'secrets' && resourceId) {
      const secrets = await supabaseRequest(`api_secrets?id=eq.${resourceId}`)
      if (!secrets || secrets.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Secret not found' }) }
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secrets[0])
      }
    }

    // POST /api-central/secrets - Create secret
    if (event.httpMethod === 'POST' && resource === 'secrets') {
      const body: ApiSecret = JSON.parse(event.body || '{}')
      const created = await supabaseRequest('api_secrets', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Prefer': 'return=representation' }
      })
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created[0])
      }
    }

    // PATCH /api-central/secrets/:id - Update secret
    if (event.httpMethod === 'PATCH' && resource === 'secrets' && resourceId) {
      const body: Partial<ApiSecret> = JSON.parse(event.body || '{}')
      body.updated_at = new Date().toISOString()
      await supabaseRequest(`api_secrets?id=eq.${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // DELETE /api-central/secrets/:id - Delete secret
    if (event.httpMethod === 'DELETE' && resource === 'secrets' && resourceId) {
      await supabaseRequest(`api_secrets?id=eq.${resourceId}`, {
        method: 'DELETE'
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // ─── PROJECTS ─────────────────────────────────────────────────────

    // GET /api-central/projects - List all projects
    if (event.httpMethod === 'GET' && resource === 'projects' && !resourceId) {
      const projects = await supabaseRequest('projects?order=name.asc')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects })
      }
    }

    // POST /api-central/projects - Create project
    if (event.httpMethod === 'POST' && resource === 'projects') {
      const body: Project = JSON.parse(event.body || '{}')
      const created = await supabaseRequest('projects', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Prefer': 'return=representation' }
      })
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created[0])
      }
    }

    // DELETE /api-central/projects/:id - Delete project
    if (event.httpMethod === 'DELETE' && resource === 'projects' && resourceId) {
      await supabaseRequest(`projects?id=eq.${resourceId}`, {
        method: 'DELETE'
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // ─── STATS ────────────────────────────────────────────────────────

    // GET /api-central/stats - Get dashboard stats
    if (event.httpMethod === 'GET' && resource === 'stats') {
      const [services, secrets]: [ApiService[], ApiSecret[]] = await Promise.all([
        supabaseRequest('api_services'),
        supabaseRequest('api_secrets')
      ])

      const active = services.filter(s => s.status === 'active')
      const totalBudget = active.reduce((a, s) => a + (s.monthly_budget || 0), 0)
      const totalSpend = active.reduce((a, s) => a + (s.current_spend || 0), 0)
      const overBudget = active.filter(s => (s.current_spend || 0) > (s.monthly_budget || 0))

      const now = new Date()
      const in14Days = new Date(now)
      in14Days.setDate(now.getDate() + 14)

      const upcoming = services.filter(s => {
        if (!s.renewal_date) return false
        const renewal = new Date(s.renewal_date)
        return renewal >= now && renewal <= in14Days
      })

      const byEntity: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      active.forEach(s => {
        byEntity[s.entity || 'Other'] = (byEntity[s.entity || 'Other'] || 0) + (s.current_spend || 0)
        byCategory[s.category || 'Other'] = (byCategory[s.category || 'Other'] || 0) + (s.current_spend || 0)
      })

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeServices: active.length,
          totalServices: services.length,
          totalBudget,
          totalSpend,
          overBudgetCount: overBudget.length,
          overBudgetServices: overBudget.map(s => s.name),
          secretsCount: secrets.length,
          servicesWithSecrets: new Set(secrets.map(s => s.service_id)).size,
          upcomingRenewals: upcoming,
          byEntity,
          byCategory
        })
      }
    }

    return { statusCode: 405, body: 'Method not allowed' }

  } catch (error) {
    console.error('API Central error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) })
    }
  }
}

export { handler }
```

---

## FILE 6: src/types/api-central.ts

```typescript
export interface ApiService {
  id: string
  name: string
  url?: string
  category: string
  entity: string
  login_method?: string
  monthly_budget: number
  current_spend: number
  billing_cycle: string
  renewal_date?: string
  status: string
  notes?: string
  projects?: string[]
  created_at?: string
  updated_at?: string
}

export interface ApiSecret {
  id: string
  service_id: string
  name: string
  value: string
  env: string
  last_rotated?: string
  expires_at?: string
  encrypted?: boolean
  created_at?: string
  updated_at?: string
}

export interface Project {
  id: string
  name: string
  entity: string
  description?: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface ApiCentralStats {
  activeServices: number
  totalServices: number
  totalBudget: number
  totalSpend: number
  overBudgetCount: number
  overBudgetServices: string[]
  secretsCount: number
  servicesWithSecrets: number
  upcomingRenewals: ApiService[]
  byEntity: Record<string, number>
  byCategory: Record<string, number>
}
```

---

## FILE 7: src/lib/auth.ts

```typescript
const TOKEN_STORAGE_KEY = 'cos-command-center-token'

/** Get the stored auth token (or null) */
export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY)
}

/** Build headers with auth token for API calls */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export { TOKEN_STORAGE_KEY }
```

---

## FILE 8: src/lib/logger.ts

```typescript
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

export const logger = {
  error(message: string, ...args: unknown[]) {
    console.error(`[API-Central] ${message}`, ...args)
  },
  warn(message: string, ...args: unknown[]) {
    if (isDev) console.warn(`[API-Central] ${message}`, ...args)
  },
  info(message: string, ...args: unknown[]) {
    if (isDev) console.info(`[API-Central] ${message}`, ...args)
  },
}
```

---

## FILE 9: src/pages/APICentral.tsx — BUILD THIS

The backend and types above define the full API contract. Build a React page component with these features:

### Tabs
1. **Dashboard** — Summary cards: active services count, total budget vs spend, over-budget alerts, upcoming renewals (14 days), spend by entity bar chart, spend by category
2. **Quick Add** — Paste an API key, auto-detect service from key format (sk-ant- = Anthropic, sk- = OpenAI, ghp_ = GitHub, etc.), save with optional PIN encryption
3. **Services** — Full CRUD table with search, filter by category/entity. Fields: name, URL, category, entity, login method, budget, spend, billing cycle, renewal date, status, notes, linked projects
4. **Secrets** — List all secrets grouped by service. Masked display (show last 4 chars). PIN-protected reveal using client-side AES-GCM encryption (WebCrypto API with PBKDF2 key derivation). Copy to clipboard.
5. **Spend** — Budget vs actual per service, grouped by entity, with progress bars and over-budget highlighting

### Customizable constants at top of file
```typescript
const CATEGORIES = ['AI/LLM', 'Database', 'Hosting', 'Dev Tools', 'Observability', 'Payments', 'Other']
const ENTITIES = ['GBI', 'Pandotic', 'FireShield', 'Personal']  // Change to your orgs
const STATUSES = ['active', 'inactive', 'trial', 'cancelled']
const LOGIN_METHODS = ['Google (personal)', 'Google (GBI)', 'GitHub', 'Email (personal)', 'Email (GBI)', 'SSO', 'Other']
const ENVS = ['production', 'staging', 'development', 'local']
```

### Client-side encryption
Secrets can be encrypted with a 4+ digit PIN before sending to Supabase. Use WebCrypto API:
- PBKDF2 (100k iterations, SHA-256) for key derivation from PIN
- AES-256-GCM for encryption
- Store as `ENC:` + base64(salt + iv + ciphertext)
- PIN remembered per session, prompted on first reveal

### API endpoints (inline config, no external import needed)
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'
const API = {
  apiServices: (id?: string) => id ? `${API_BASE}/api-central/services/${id}` : `${API_BASE}/api-central/services`,
  apiSecrets: (id?: string) => id ? `${API_BASE}/api-central/secrets/${id}` : `${API_BASE}/api-central/secrets`,
  apiProjects: `${API_BASE}/api-central/projects`,
  apiStats: `${API_BASE}/api-central/stats`,
}
```

### Integration steps
1. Create all files above
2. Run setup.sql against Supabase
3. Add route: `<Route path="/api-central" element={<APICentral />} />`
4. Add nav link with `Zap` icon from lucide-react
5. Set env vars: SUPABASE_URL, SUPABASE_ANON_KEY, APP_PASSWORD
