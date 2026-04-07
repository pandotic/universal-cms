"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  validateThemeContrast,
  type ContrastResult,
} from "@/lib/utils/contrast";

// ---------------------------------------------------------------------------
// Theme token values (mirrored from globals.css)
// ---------------------------------------------------------------------------

const lightTheme: Record<string, string> = {
  surface: "#ffffff",
  "surface-secondary": "#f9fafb",
  "surface-tertiary": "#f3f4f6",
  "surface-invert": "#111827",
  foreground: "#111827",
  "foreground-secondary": "#6b7280",
  "foreground-tertiary": "#9ca3af",
  "foreground-muted": "#d1d5db",
  "foreground-invert": "#ffffff",
  "brand-primary": "#0f766e",
};

const darkTheme: Record<string, string> = {
  surface: "#0f172a",
  "surface-secondary": "#1e293b",
  "surface-tertiary": "#334155",
  "surface-invert": "#f9fafb",
  foreground: "#f1f5f9",
  "foreground-secondary": "#94a3b8",
  "foreground-tertiary": "#64748b",
  "foreground-muted": "#475569",
  "foreground-invert": "#0f172a",
  "brand-primary": "#0f766e",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Badge({
  pass,
  label,
}: {
  pass: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
        pass
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {label}: {pass ? "Pass" : "Fail"}
    </span>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-5 w-5 rounded border border-border"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

// ---------------------------------------------------------------------------
// Result card
// ---------------------------------------------------------------------------

function PairCard({ result }: { result: ContrastResult }) {
  const [fgLabel, bgLabel] = result.labels;
  const [fg, bg] = result.pair;
  const failing = !result.passAA;

  return (
    <div
      className={`rounded-lg border p-4 ${
        failing
          ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950"
          : "border-border bg-surface"
      }`}
    >
      {/* Swatches + labels */}
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Swatch color={fg} />
        <span className="font-medium text-foreground">{fgLabel}</span>
        <span className="text-foreground-secondary">on</span>
        <Swatch color={bg} />
        <span className="font-medium text-foreground">{bgLabel}</span>
      </div>

      {/* Sample text */}
      <div
        className="mb-3 rounded p-2 text-sm"
        style={{ color: fg, backgroundColor: bg }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>

      {/* Ratio + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-mono font-semibold text-foreground">
          {result.ratio.toFixed(2)}:1
        </span>
        <Badge pass={result.passAA} label="AA" />
        <Badge pass={result.passAAA} label="AAA" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theme section
// ---------------------------------------------------------------------------

function ThemeSection({
  title,
  results,
}: {
  title: string;
  results: ContrastResult[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((r) => (
          <PairCard key={`${r.labels[0]}-${r.labels[1]}`} result={r} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContrastQAPage() {
  const lightResults = validateThemeContrast(lightTheme);
  const darkResults = validateThemeContrast(darkTheme);

  return (
    <AdminShell
      title="Contrast QA"
      description="WCAG contrast ratio validation for all theme color pairings"
    >
      <ThemeSection title="Light Theme" results={lightResults} />
      <ThemeSection title="Dark Theme" results={darkResults} />
    </AdminShell>
  );
}
