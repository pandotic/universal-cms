import { describe, it, expect } from "vitest";
import {
  relativeLuminance,
  contrastRatio,
  meetsAA,
  meetsAAA,
  validateThemeContrast,
} from "../utils/contrast";

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 4);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 4);
  });

  it("handles 3-digit hex", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 4);
    expect(relativeLuminance("#000")).toBeCloseTo(0, 4);
  });
});

describe("contrastRatio", () => {
  it("returns 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1:1 for same color", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 4);
  });

  it("is symmetric", () => {
    const r1 = contrastRatio("#ff0000", "#0000ff");
    const r2 = contrastRatio("#0000ff", "#ff0000");
    expect(r1).toBeCloseTo(r2, 4);
  });
});

describe("meetsAA", () => {
  it("black on white passes AA", () => {
    expect(meetsAA("#000000", "#ffffff")).toBe(true);
  });

  it("light gray on white fails AA for normal text", () => {
    // #999999 on white is ~2.85:1
    expect(meetsAA("#999999", "#ffffff")).toBe(false);
  });

  it("uses 3:1 threshold for large text", () => {
    // #767676 on white is ~4.54:1, passes both thresholds
    expect(meetsAA("#767676", "#ffffff", true)).toBe(true);
  });
});

describe("meetsAAA", () => {
  it("black on white passes AAA", () => {
    expect(meetsAAA("#000000", "#ffffff")).toBe(true);
  });

  it("medium gray on white fails AAA for normal text", () => {
    // #767676 on white is ~4.54:1, fails AAA (needs 7:1)
    expect(meetsAAA("#767676", "#ffffff")).toBe(false);
  });
});

describe("validateThemeContrast", () => {
  it("returns results for each semantic pairing", () => {
    const theme: Record<string, string> = {
      surface: "#ffffff",
      "surface-secondary": "#f5f5f5",
      "surface-tertiary": "#e5e5e5",
      "surface-invert": "#1a1a1a",
      foreground: "#1a1a1a",
      "foreground-secondary": "#4a4a4a",
      "foreground-tertiary": "#6a6a6a",
      "foreground-invert": "#ffffff",
      "brand-primary": "#0f766e",
    };
    const results = validateThemeContrast(theme);
    expect(results.length).toBe(8);
    for (const r of results) {
      expect(r.ratio).toBeGreaterThan(0);
      expect(typeof r.passAA).toBe("boolean");
      expect(typeof r.passAAA).toBe("boolean");
    }
  });
});
