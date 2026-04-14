# Layer Presets

Default layer configurations for common project types. Customize colors and layers based on what the codebase analysis discovers.

## Next.js + AI App (e.g., GameSenseAI)

```typescript
export const LAYER_ORDER = ['frontend', 'api', 'ai', 'data', 'database', 'external'];

export const LAYER_CONFIG = {
  frontend: {
    label: 'Frontend',
    subtitle: 'Next.js 16 · React 19 · TypeScript',
    color: '#00AFF0',
    iconPath: 'M2 3h20v14H2V3zm2 2v10h16V5H4zm-1 14h18v2H3v-2z',
  },
  api: {
    label: 'API Layer',
    subtitle: 'Route Handlers · Middleware',
    color: '#10B981',
    iconPath: 'M2 2h20v6H2V2zm0 8h20v6H2v-6zm0 8h20v4H2v-4zm3-14h2v2H5V4zm0 8h2v2H5v-2z',
  },
  ai: {
    label: 'AI Engine',
    subtitle: 'OpenAI · ElevenLabs · Deepgram',
    color: '#F59E0B',
    iconPath: 'M9 2v3H6v2H3v4h3v2H3v4h3v2h3v3h2v-3h2v3h2v-3h3v-2h3v-4h-3v-2h3V7h-3V5h-3V2h-2v3h-2V2H9zm0 5h6v6H9V7z',
  },
  data: {
    label: 'Data Layer',
    subtitle: 'Pipelines · Transforms · Static Data',
    color: '#3B82F6',
    iconPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  database: {
    label: 'Database',
    subtitle: 'Supabase · PostgreSQL · RLS',
    color: '#A78BFA',
    iconPath: 'M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zm0 2c4.42 0 8 1.34 8 3s-3.58 3-8 3-8-1.34-8-3 3.58-3 8-3zM4 9.26C5.81 10.36 8.78 11 12 11s6.19-.64 8-1.74V12c0 1.66-3.58 3-8 3s-8-1.34-8-3V9.26zM4 14.26C5.81 15.36 8.78 16 12 16s6.19-.64 8-1.74V18c0 1.66-3.58 3-8 3s-8-1.34-8-3v-3.74z',
  },
  external: {
    label: 'External Services',
    subtitle: 'APIs · CDNs · Hosting',
    color: '#F43F5E',
    iconPath: 'M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  },
};
```

## React + Vite SPA

```typescript
export const LAYER_ORDER = ['frontend', 'backend', 'database', 'external', 'cicd', 'security'];

export const LAYER_CONFIG = {
  frontend: { label: 'Frontend', subtitle: 'React 18 · Vite 5', color: '#00AFF0', iconPath: '...' },
  backend:  { label: 'Backend',  subtitle: 'Edge Functions · TypeScript', color: '#10B981', iconPath: '...' },
  database: { label: 'Database', subtitle: 'PostgreSQL · Supabase', color: '#F59E0B', iconPath: '...' },
  external: { label: 'External', subtitle: 'Auth · APIs · CDN', color: '#3B82F6', iconPath: '...' },
  cicd:     { label: 'CI / CD',  subtitle: 'GitHub Actions · Netlify', color: '#A78BFA', iconPath: '...' },
  security: { label: 'Security', subtitle: 'RLS · CSP · CORS', color: '#F43F5E', iconPath: '...' },
};
```

## Full-Stack with Microservices

```typescript
export const LAYER_ORDER = ['frontend', 'gateway', 'services', 'messaging', 'database', 'infrastructure'];
```

## Color Palette Guidelines

- Use distinct, high-contrast colors for each layer
- Avoid colors too close together (blue vs cyan, red vs orange)
- Recommended palette for 6 layers:
  - `#00AFF0` (sky blue) — Frontend
  - `#10B981` (emerald) — API/Backend
  - `#F59E0B` (amber) — AI/Compute
  - `#3B82F6` (blue) — Data
  - `#A78BFA` (violet) — Database
  - `#F43F5E` (rose) — External/Security
