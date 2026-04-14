# Architecture Page Component Template

Use this as the base template for generating the ArchitecturePage component. Adapt to the project's theme (dark/light), CSS framework, and tech stack.

## Extensibility

This template is NOT limited to system architecture. The same pattern works for any domain that has **categorized nodes with relationships**:
- **System Architecture** — frontend, API, AI, database layers
- **Learning Science** — theory, core systems, delivery, safety layers
- **Data Pipelines** — ingestion, transform, storage, serving layers
- **Design Systems** — tokens, primitives, components, patterns layers

To create a new visualization: define a new data file with domain-specific layers, nodes, connections, and connection types. The component code is identical — only the data changes.

## Component Structure

```
ArchitecturePage.tsx
├── Imports (data file + React hooks)
├── Helper: hexToRgba()
├── Helper: parseLoc()
├── Sub-component: NodeIcon (renders SVG from iconPath)
├── Sub-component: StatCard (3-col tech spec card)
├── Sub-component: ConnectionChip (clickable connection badge)
├── Sub-component: NodeCard (clickable architecture node)
├── Sub-component: FlyoutPanel (340px detail panel)
├── Main: ArchitecturePage
│   ├── State: selectedNode, hoveredNode, activeLayer, showConnections, displayMode, activeConnType, lineData
│   ├── Computed: nodesById, layerGroups, layerStats, connTypeCounts, filteredConnections
│   ├── Effect: recalcLines (SVG Bezier path calculation)
│   ├── Effect: ResizeObserver for dynamic line recalculation
│   ├── Effect: Escape key handler
│   ├── Render: Header bar (title + stats + toggles)
│   ├── Render: Layer filter chips
│   ├── Render: Connection type filter chips
│   ├── Render: Layer sections with node cards
│   ├── Render: SVG overlay with connection lines
│   └── Render: Flyout panel (conditional)
```

## CRITICAL: containerRef Placement

**The `containerRef` MUST be on the same element that the SVG overlay is positioned relative to.** This is the most common source of broken line endpoints.

The SVG uses `className="absolute inset-0"` inside a `position: relative` container. The `getBoundingClientRect()` calculations subtract `containerRect` to get coordinates relative to this container. If `containerRef` is on an outer wrapper that includes filter chips, stat cards, or other elements above the `relative` div, ALL line Y-coordinates will be offset by the height of those elements — lines will appear to start/end at wrong cards.

```
WRONG:
<div ref={containerRef}>          ← containerRef here
  <div>filter chips</div>         ← 80px of content
  <div>connection controls</div>  ← 40px of content
  <div className="relative">      ← SVG parent (y offset = 120px)
    <section>cards</section>
    <svg absolute inset-0>lines</svg>  ← lines drawn 120px too low
  </div>
</div>

CORRECT:
<div>
  <div>filter chips</div>
  <div>connection controls</div>
  <div ref={containerRef} className="relative">  ← containerRef HERE
    <section>cards</section>
    <svg absolute inset-0>lines</svg>  ← coordinates match SVG origin
  </div>
</div>
```

## SVG Bezier Connection Algorithm

This is the critical rendering logic. The component calculates SVG paths dynamically based on DOM positions.

```typescript
const CURVE_INTENSITY = 0.35;
const MAX_CURVE = 30;
const CP_OFFSET = 25;

function recalcLines() {
  if (!containerRef.current || !showConnections) {
    setLineData([]);
    return;
  }

  const containerRect = containerRef.current.getBoundingClientRect();
  const lines: LineData[] = [];

  for (const conn of filteredConnections) {
    const fromEl = nodeRefs.current[conn.from];
    const toEl = nodeRefs.current[conn.to];
    if (!fromEl || !toEl) continue;

    const fRect = fromEl.getBoundingClientRect();
    const tRect = toEl.getBoundingClientRect();

    // Relative to container
    const fCx = fRect.left + fRect.width / 2 - containerRect.left;
    const fCy = fRect.top + fRect.height / 2 - containerRect.top;
    const tCx = tRect.left + tRect.width / 2 - containerRect.left;
    const tCy = tRect.top + tRect.height / 2 - containerRect.top;

    const fTop = fRect.top - containerRect.top;
    const fBottom = fTop + fRect.height;
    const fLeft = fRect.left - containerRect.left;
    const fRight = fLeft + fRect.width;
    const tTop = tRect.top - containerRect.top;
    const tBottom = tTop + tRect.height;
    const tLeft = tRect.left - containerRect.left;
    const tRight = tLeft + tRect.width;

    const fromLayer = nodesById[conn.from]?.layer;
    const toLayer = nodesById[conn.to]?.layer;
    const sameLayer = fromLayer === toLayer;

    let d: string;

    if (sameLayer) {
      // Horizontal arc between nodes in same layer
      const fromIsLeft = fCx < tCx;
      const pad = 4;
      const x1 = fromIsLeft ? fRight + pad : fLeft - pad;
      const y1 = fCy;
      const x2 = fromIsLeft ? tLeft - pad : tRight + pad;
      const y2 = tCy;
      const dx = Math.abs(x2 - x1);
      const midX = (x1 + x2) / 2;
      const curveY = Math.min(dx * CURVE_INTENSITY, MAX_CURVE);
      d = `M ${x1} ${y1} C ${midX} ${y1 + curveY}, ${midX} ${y2 + curveY}, ${x2} ${y2}`;
    } else {
      const goingDown = LAYER_ORDER.indexOf(fromLayer) < LAYER_ORDER.indexOf(toLayer);

      if (goingDown) {
        // Top-down flow: bottom of source → top of target
        const x1 = fCx;
        const y1 = fBottom + 2;
        const x2 = tCx;
        const y2 = tTop - 2;
        const dist = Math.abs(y2 - y1);
        const cpOffset = Math.max(dist * 0.4, CP_OFFSET);
        d = `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
      } else {
        // Upward flow: top of source → bottom of target
        const x1 = fCx;
        const y1 = fTop - 2;
        const x2 = tCx;
        const y2 = tBottom + 2;
        const dist = Math.abs(y1 - y2);
        const cpOffset = Math.max(dist * 0.4, CP_OFFSET);
        d = `M ${x1} ${y1} C ${x1} ${y1 - cpOffset}, ${x2} ${y2 + cpOffset}, ${x2} ${y2}`;
      }
    }

    lines.push({ ...conn, id: `${conn.from}-${conn.to}`, d });
  }

  setLineData(lines);
}
```

## Light + Dark Theme System

Use CSS custom properties scoped via a `data-hiw-mode` attribute on the container. This lets the visualization have its own light/dark toggle independent of the app's theme.

```html
<div data-hiw-mode="light">   <!-- or "dark" -->
  <!-- all content uses var(--hiw-*) tokens -->
</div>
```

### CSS Custom Properties

```css
/* Dark mode (default) */
[data-hiw-mode="dark"] {
  --hiw-bg-1: #0a0a1a;
  --hiw-bg-2: #0d0d22;
  --hiw-bg-3: #10102a;
  --hiw-header-bg: rgba(10,10,26,0.85);
  --hiw-text: rgba(255,255,255,0.95);
  --hiw-text-80: rgba(255,255,255,0.8);
  --hiw-text-60: rgba(255,255,255,0.6);
  --hiw-text-50: rgba(255,255,255,0.5);
  --hiw-text-40: rgba(255,255,255,0.4);
  --hiw-text-30: rgba(255,255,255,0.3);
  --hiw-text-25: rgba(255,255,255,0.25);
  --hiw-text-20: rgba(255,255,255,0.2);
  --hiw-surface-2: rgba(255,255,255,0.02);
  --hiw-surface-3: rgba(255,255,255,0.03);
  --hiw-surface-4: rgba(255,255,255,0.04);
  --hiw-surface-5: rgba(255,255,255,0.05);
  --hiw-surface-6: rgba(255,255,255,0.06);
  --hiw-surface-7: rgba(255,255,255,0.07);
  --hiw-surface-10: rgba(255,255,255,0.10);
  --hiw-surface-15: rgba(255,255,255,0.15);
  --hiw-border-4: rgba(255,255,255,0.04);
  --hiw-border-6: rgba(255,255,255,0.06);
  --hiw-border-10: rgba(255,255,255,0.10);
  --hiw-flyout-bg: #0f0f1e;
  --hiw-flyout-mobile: rgba(10,10,26,0.95);
  --hiw-line-subtle: rgba(255,255,255,0.7);
  --hiw-line-faint: rgba(255,255,255,0.4);
}

/* Light mode */
[data-hiw-mode="light"] {
  --hiw-bg-1: #f0f2f8;
  --hiw-bg-2: #e8eaf2;
  --hiw-bg-3: #e0e3ed;
  --hiw-header-bg: rgba(240,242,248,0.85);
  --hiw-text: rgba(15,15,35,0.95);
  --hiw-text-80: rgba(15,15,35,0.8);
  --hiw-text-60: rgba(15,15,35,0.6);
  --hiw-text-50: rgba(15,15,35,0.5);
  --hiw-text-40: rgba(15,15,35,0.4);
  --hiw-text-30: rgba(15,15,35,0.3);
  --hiw-text-25: rgba(15,15,35,0.25);
  --hiw-text-20: rgba(15,15,35,0.2);
  --hiw-surface-2: rgba(15,15,35,0.02);
  --hiw-surface-3: rgba(15,15,35,0.03);
  --hiw-surface-4: rgba(15,15,35,0.04);
  --hiw-surface-5: rgba(15,15,35,0.05);
  --hiw-surface-6: rgba(15,15,35,0.06);
  --hiw-surface-7: rgba(15,15,35,0.07);
  --hiw-surface-10: rgba(15,15,35,0.10);
  --hiw-surface-15: rgba(15,15,35,0.15);
  --hiw-border-4: rgba(15,15,35,0.04);
  --hiw-border-6: rgba(15,15,35,0.06);
  --hiw-border-10: rgba(15,15,35,0.10);
  --hiw-flyout-bg: #f5f6fa;
  --hiw-flyout-mobile: rgba(240,242,248,0.95);
  --hiw-line-subtle: rgba(0,0,0,0.7);
  --hiw-line-faint: rgba(0,0,0,0.4);
}
```

### Usage Pattern (replaces hardcoded dark classes)

```
// Node card
"bg-[var(--hiw-surface-4)] border border-[var(--hiw-border-6)] rounded-lg p-3 cursor-pointer hover:bg-[var(--hiw-surface-7)]"

// Selected node
"bg-[var(--hiw-surface-10)] ring-2" + dynamic ring/border color from layer

// Layer header
"text-sm font-bold uppercase tracking-widest" + style={{ color: config.color }}

// Flyout panel
"fixed right-0 top-0 h-full w-[340px] bg-[var(--hiw-flyout-bg)] border-l border-[var(--hiw-border-10)] z-50"

// Filter chip (active)
"bg-[var(--hiw-surface-15)] text-[var(--hiw-text)]"

// Filter chip (inactive)
"bg-[var(--hiw-surface-5)] text-[var(--hiw-text-50)] hover:bg-[var(--hiw-surface-10)]"
```

### Connection Line Opacity (Important)

Lines must be **very dim by default** so they don't overwhelm the card grid, but **bright when highlighted** on hover/select:

```
// Idle (no node selected/hovered): barely visible
opacity: 0.06
stroke: var(--hiw-line-subtle)
strokeWidth: 1

// Highlighted (connected to hovered/selected node): bright
opacity: 0.85
stroke: {layerColor}
strokeWidth: 2.2

// Dimmed (not connected to hovered/selected node): nearly invisible
opacity: 0.01

// Animated flow overlay (on highlighted lines only)
strokeDasharray="4 14"
opacity="0.35"
animation: archDashFlow 1.8s linear infinite
```

### Light/Dark Toggle Button

Include a toggle in the header. Store mode in component state:
```tsx
const [mode, setMode] = useState<'light' | 'dark'>('light')
// Apply: <div data-hiw-mode={mode}>
```

## Required CSS Keyframes

Add to globals.css or inject via style tag:

```css
@keyframes archDashFlow {
  to { stroke-dashoffset: -24; }
}

@keyframes archFadeIn {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes archSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

## Line Recalculation Timing (Important)

The `archFadeIn` animation applies `transform: translateY(8px) scale(0.97)` which corrupts `getBoundingClientRect()` during animation. Lines MUST be recalculated AFTER animations complete.

Use a dual-timeout pattern plus ResizeObserver:

```typescript
// Dual timeout: first rough pass, then accurate pass after animations
useEffect(() => {
  const t1 = setTimeout(recalcLines, 150)
  const t2 = setTimeout(recalcLines, 700)  // archFadeIn max = 0.6s
  return () => { clearTimeout(t1); clearTimeout(t2) }
}, [recalcLines, activeLayer, activeConnType, displayMode])

// ResizeObserver + scroll listener for dynamic recalculation
useEffect(() => {
  if (!containerRef.current) return
  const observer = new ResizeObserver(() => recalcLines())
  observer.observe(containerRef.current)
  const scrollParent = containerRef.current.closest('[data-hiw-mode]')
  const onScroll = () => { requestAnimationFrame(recalcLines) }
  scrollParent?.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    observer.disconnect()
    scrollParent?.removeEventListener('scroll', onScroll)
  }
}, [recalcLines])
```

## Flyout Panel Content

```
┌──────────────────────────────┐
│ [color bar 3px]              │
│ [Icon] Node Label            │
│ [tech badge] [layer badge]   │
│ ─────────────────────────── │
│ Description (2-3 sentences)  │
│                              │
│ ┌────────┬────────┬────────┐│
│ │Language │ Files  │  LOC   ││
│ │TS (TSX)│   12   │ ~2,400 ││
│ └────────┴────────┴────────┘│
│                              │
│ KEY FILES                    │
│  src/app/page.tsx            │
│  src/components/Dashboard.tsx│
│                              │
│ KEY FUNCTIONALITY            │
│  • Renders main dashboard    │
│  • Manages player state      │
│  • Fetches game data         │
│                              │
│ CONNECTIONS (5)              │
│  Depends On →                │
│  [API Layer] HTTP            │
│  [Database] Query            │
│  ← Used By                   │
│  [Shell] Uses                │
└──────────────────────────────┘
```

## Mobile Responsive Behavior

- Layers stack vertically (always)
- Node cards: 2 columns on mobile, 3-4 on tablet, 5+ on desktop
- Flyout: Full-screen modal on mobile (not side panel)
- Connection lines: Hidden on mobile (too cluttered), show toggle
- Filter chips: Horizontal scroll on mobile

## State Management Summary

```typescript
const [selectedNode, setSelectedNode] = useState<string | null>(null);
const [hoveredNode, setHoveredNode] = useState<string | null>(null);
const [activeLayer, setActiveLayer] = useState<string | null>(null);
const [showConnections, setShowConnections] = useState(true);
const [displayMode, setDisplayMode] = useState<'card' | 'compact'>('card');
const [activeConnType, setActiveConnType] = useState<string | null>(null);
const [lineData, setLineData] = useState<LineData[]>([]);

const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
const containerRef = useRef<HTMLDivElement | null>(null);
```
