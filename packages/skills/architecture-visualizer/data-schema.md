# Architecture Data Schema

TypeScript interfaces for the architecture data file.

```typescript
// --- Layer Configuration ---

export interface LayerConfig {
  label: string;        // Display name: "Frontend", "API", "AI Engine"
  subtitle: string;     // Tech stack: "Next.js 16 · React 19 · TypeScript"
  color: string;        // Hex color: "#00AFF0"
  iconPath: string;     // SVG path data for the layer icon (24x24 viewBox)
}

export const LAYER_ORDER: string[] = [
  // Ordered top-to-bottom as they appear in the visualization
  // Example: ['frontend', 'api', 'ai', 'data', 'database', 'external']
];

export const LAYER_CONFIG: Record<string, LayerConfig> = {
  // Keys must match LAYER_ORDER entries
};

// --- Connection Types ---

export interface ConnectionTypeConfig {
  label: string;        // Display name: "HTTP", "Query", "Auth"
  dash: string;         // SVG strokeDasharray: 'none' (solid), '6 3' (dashed), '3 3' (dotted)
}

export const CONNECTION_TYPES: Record<string, ConnectionTypeConfig> = {
  uses:     { label: 'Uses',       dash: 'none' },
  calls:    { label: 'Calls',      dash: 'none' },
  reads:    { label: 'Reads',      dash: 'none' },
  http:     { label: 'HTTP',       dash: '6 3' },
  query:    { label: 'Query',      dash: '6 3' },
  auth:     { label: 'Auth',       dash: '3 3' },
  sends:    { label: 'Sends',      dash: '4 4' },
  protects: { label: 'Protects',   dash: '3 3' },
  hosts:    { label: 'Hosts',      dash: '3 3' },
  deploys:  { label: 'Deploys',    dash: '3 3' },
  produces: { label: 'Produces',   dash: 'none' },
  triggers: { label: 'Triggers',   dash: '6 3' },
};

// --- Architecture Nodes ---

export interface NodeDetails {
  fileCount: number;          // Number of source files
  linesOfCode: string;        // "1,200" or "~800" or "Managed" or "External"
  language: string;           // "TypeScript (TSX)" or "SQL" or "Python"
  keyFiles: string[];         // Relative file paths: ["src/app/page.tsx"]
  keyFunctionality: string[]; // Bullet descriptions: ["Renders the main dashboard"]
}

export interface ArchitectureNode {
  id: string;                 // Unique: "fe-shell", "api-ai-briefing"
  label: string;              // Display: "App Shell", "AI Briefing"
  layer: string;              // Must match LAYER_CONFIG key
  iconPath: string;           // SVG path data (24x24 viewBox)
  tech: string;               // "React 19 · TSX", "Route Handler · OpenAI"
  description: string;        // 2-3 sentence description
  details: NodeDetails;
}

export const ARCHITECTURE_NODES: ArchitectureNode[] = [];

// --- Connections ---

export interface Connection {
  from: string;               // Source node ID (must exist in ARCHITECTURE_NODES)
  to: string;                 // Target node ID (must exist in ARCHITECTURE_NODES)
  type: string;               // Must match CONNECTION_TYPES key
  label: string;              // Brief: "POST /api/ai/briefing", "supabase.from('roster')"
}

export const CONNECTIONS: Connection[] = [];
```

## ID Naming Convention

Use layer prefix + descriptive short name:
- Frontend: `fe-shell`, `fe-dashboard`, `fe-playbook`, `fe-hooks`
- API: `api-ai-briefing`, `api-nfl-proxy`, `api-db-roster`
- AI: `ai-openai`, `ai-guardrails`, `ai-prompt-builder`
- Data: `data-nflverse`, `data-espn`, `data-plays`
- Database: `db-supabase`, `db-migrations`, `db-rls`
- External: `ext-netlify`, `ext-github`, `ext-openai-api`

## SVG Icon Paths

Use simple 24x24 viewBox SVG paths. Common ones:

```typescript
const ICONS = {
  // Monitor (Frontend)
  monitor: 'M2 3h20v14H2V3zm2 2v10h16V5H4zm-1 14h18v2H3v-2z',
  // Server (API)
  server: 'M2 2h20v6H2V2zm0 8h20v6H2v-6zm0 8h20v4H2v-4zm3-14h2v2H5V4zm0 8h2v2H5v-2z',
  // Cpu (AI)
  cpu: 'M9 2v3H6v2H3v4h3v2H3v4h3v2h3v3h2v-3h2v3h2v-3h3v-2h3v-4h-3v-2h3V7h-3V5h-3V2h-2v3h-2V2H9zm0 5h6v6H9V7z',
  // Database
  database: 'M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zm0 2c4.42 0 8 1.34 8 3s-3.58 3-8 3-8-1.34-8-3 3.58-3 8-3zM4 9.26C5.81 10.36 8.78 11 12 11s6.19-.64 8-1.74V12c0 1.66-3.58 3-8 3s-8-1.34-8-3V9.26zM4 14.26C5.81 15.36 8.78 16 12 16s6.19-.64 8-1.74V18c0 1.66-3.58 3-8 3s-8-1.34-8-3v-3.74z',
  // Cloud (External)
  cloud: 'M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  // Shield (Security)
  shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
  // Zap (Pipeline)
  zap: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
  // Globe
  globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  // Key (Auth)
  key: 'M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 005.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  // GitBranch (CI/CD)
  gitBranch: 'M6 3v6.28a4 4 0 100 5.44V21h2v-6.28a4 4 0 100-5.44V3H6zm0 10a2 2 0 110 4 2 2 0 010-4zm12-4a2 2 0 110-4 2 2 0 010 4z',
  // Layers
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  // Code
  code: 'M8 3l-6 9 6 9M16 3l6 9-6 9',
  // Settings
  settings: 'M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7zm7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z',
};
```
