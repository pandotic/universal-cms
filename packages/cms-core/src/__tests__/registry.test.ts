import { describe, it, expect } from "vitest";
import { MODULE_REGISTRY, getModuleInfo, getModulesByCategory } from "../registry";
import { modulePresets } from "../config";

describe("MODULE_REGISTRY", () => {
  it("contains exactly 30 modules", () => {
    expect(MODULE_REGISTRY.length).toBe(31);
  });

  it("has unique module names", () => {
    const names = MODULE_REGISTRY.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("covers all modules from the full preset", () => {
    const registryNames = new Set(MODULE_REGISTRY.map((m) => m.name));
    for (const mod of modulePresets.full.modules) {
      expect(registryNames.has(mod)).toBe(true);
    }
  });

  it("every module has required fields", () => {
    for (const mod of MODULE_REGISTRY) {
      expect(mod.name).toBeTruthy();
      expect(mod.label).toBeTruthy();
      expect(mod.description).toBeTruthy();
      expect(mod.category).toBeTruthy();
      expect(Array.isArray(mod.migrations)).toBe(true);
    }
  });

  it("categories are valid values", () => {
    const validCategories = ["content", "directory", "career", "engagement", "seo", "tools", "forms", "system"];
    for (const mod of MODULE_REGISTRY) {
      expect(validCategories).toContain(mod.category);
    }
  });
});

describe("getModuleInfo", () => {
  it("returns module info for a valid name", () => {
    const info = getModuleInfo("contentPages");
    expect(info).toBeDefined();
    expect(info!.label).toBe("Content Pages");
    expect(info!.category).toBe("content");
  });

  it("returns undefined for an unknown name", () => {
    const info = getModuleInfo("nonExistent" as never);
    expect(info).toBeUndefined();
  });
});

describe("getModulesByCategory", () => {
  it("returns only modules of the given category", () => {
    const seoModules = getModulesByCategory("seo");
    expect(seoModules.length).toBeGreaterThan(0);
    for (const mod of seoModules) {
      expect(mod.category).toBe("seo");
    }
  });

  it("returns empty array for a category with no modules", () => {
    const result = getModulesByCategory("nonexistent" as never);
    expect(result).toEqual([]);
  });
});
