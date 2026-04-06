/**
 * WCAG 2.1 contrast-ratio utilities.
 * Pure functions, zero external dependencies.
 */

// ---------------------------------------------------------------------------
// Hex -> relative luminance (WCAG 2.1 definition)
// ---------------------------------------------------------------------------

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Convert a hex color (e.g. "#0f766e") to its WCAG 2.1 relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// ---------------------------------------------------------------------------
// Contrast ratio
// ---------------------------------------------------------------------------

/** WCAG contrast ratio between two hex colors (always >= 1). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// AA / AAA checks
// ---------------------------------------------------------------------------

/** Returns true when the pair meets WCAG AA (4.5:1 normal, 3:1 large text). */
export function meetsAA(
  fg: string,
  bg: string,
  isLargeText = false,
): boolean {
  const threshold = isLargeText ? 3 : 4.5;
  return contrastRatio(fg, bg) >= threshold;
}

/** Returns true when the pair meets WCAG AAA (7:1 normal, 4.5:1 large text). */
export function meetsAAA(
  fg: string,
  bg: string,
  isLargeText = false,
): boolean {
  const threshold = isLargeText ? 4.5 : 7;
  return contrastRatio(fg, bg) >= threshold;
}

// ---------------------------------------------------------------------------
// Theme validation
// ---------------------------------------------------------------------------

export interface ContrastResult {
  pair: [string, string];
  labels: [string, string];
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
}

/**
 * Validate all semantic foreground/background pairings in a theme map.
 *
 * Expected keys: surface, surface-secondary, surface-tertiary, surface-invert,
 * foreground, foreground-secondary, foreground-tertiary, foreground-invert,
 * brand-primary.
 */
export function validateThemeContrast(
  theme: Record<string, string>,
): ContrastResult[] {
  const pairings: [string, string][] = [
    ["foreground", "surface"],
    ["foreground-secondary", "surface"],
    ["foreground-tertiary", "surface"],
    ["foreground", "surface-secondary"],
    ["foreground-secondary", "surface-secondary"],
    ["foreground", "surface-tertiary"],
    ["brand-primary", "#ffffff"],
    ["foreground-invert", "surface-invert"],
  ];

  return pairings.map(([fgKey, bgKey]) => {
    const fg = theme[fgKey] ?? fgKey; // allow raw hex (e.g. #ffffff)
    const bg = theme[bgKey] ?? bgKey;
    const ratio = contrastRatio(fg, bg);
    return {
      pair: [fg, bg] as [string, string],
      labels: [fgKey, bgKey] as [string, string],
      ratio,
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7,
    };
  });
}
