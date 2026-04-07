import { describe, it, expect } from "vitest";
import {
  modulesFromPreset,
  modulePresets,
  isModuleEnabled,
  getRequiredMigrations,
  MODULE_MIGRATIONS,
  CORE_MIGRATIONS,
  type CmsConfig,
  type CmsModuleName,
} from "../config";

const makeConfig = (modules: Record<CmsModuleName, boolean>): CmsConfig =>
  ({
    siteName: "Test",
    siteUrl: "https://test.com",
    siteDescription: "Test site",
    siteTagline: "Test",
    primaryEntity: { name: "items", singular: "Item", plural: "Items", slugPrefix: "/items" },
    modules,
    roles: ["admin"],
    adminNav: [],
    analytics: { availableProviders: [] },
    storage: { mediaBucket: "media", maxFileSizeMb: 10, allowedMimeTypes: [] },
  }) as CmsConfig;

describe("modulesFromPreset", () => {
  it("enables only the modules listed in the preset", () => {
    const result = modulesFromPreset(modulePresets.blog);
    expect(result.contentPages).toBe(true);
    expect(result.mediaLibrary).toBe(true);
    expect(result.seo).toBe(true);
    // blog preset does NOT include directory modules
    expect(result.directory).toBe(false);
    expect(result.affiliates).toBe(false);
    expect(result.careerHub).toBe(false);
  });

  it("full preset enables all modules", () => {
    const result = modulesFromPreset(modulePresets.full);
    const allTrue = Object.values(result).every((v) => v === true);
    expect(allTrue).toBe(true);
  });

  it("returns a record with every CmsModuleName key", () => {
    const result = modulesFromPreset(modulePresets.appMarketing);
    // Should have exactly 30 keys (all module names)
    expect(Object.keys(result).length).toBe(30);
  });
});

describe("isModuleEnabled", () => {
  it("returns true for enabled modules", () => {
    const config = makeConfig(modulesFromPreset(modulePresets.blog));
    expect(isModuleEnabled(config, "contentPages")).toBe(true);
  });

  it("returns false for disabled modules", () => {
    const config = makeConfig(modulesFromPreset(modulePresets.blog));
    expect(isModuleEnabled(config, "careerHub")).toBe(false);
  });
});

describe("getRequiredMigrations", () => {
  it("always includes core migrations", () => {
    const config = makeConfig(modulesFromPreset(modulePresets.appMarketing));
    const migrations = getRequiredMigrations(config);
    for (const core of CORE_MIGRATIONS) {
      expect(migrations).toContain(core);
    }
  });

  it("includes module-specific migrations for enabled modules", () => {
    const config = makeConfig(modulesFromPreset(modulePresets.blog));
    const migrations = getRequiredMigrations(config);
    // contentPages requires 00004_content_pages
    expect(migrations).toContain("00004_content_pages");
  });

  it("deduplicates shared migrations", () => {
    const config = makeConfig(modulesFromPreset(modulePresets.directory));
    const migrations = getRequiredMigrations(config);
    // directory, categories, frameworks, glossary all share 00014_core_taxonomy_tables
    const count = migrations.filter((m) => m === "00014_core_taxonomy_tables").length;
    expect(count).toBe(1);
  });

  it("returns sorted migrations", () => {
    const config = makeConfig(modulesFromPreset(modulePresets.full));
    const migrations = getRequiredMigrations(config);
    const sorted = [...migrations].sort();
    expect(migrations).toEqual(sorted);
  });
});

describe("MODULE_MIGRATIONS", () => {
  it("has an entry for every module in the full preset", () => {
    const allModules = modulePresets.full.modules;
    for (const mod of allModules) {
      expect(MODULE_MIGRATIONS).toHaveProperty(mod);
      expect(Array.isArray(MODULE_MIGRATIONS[mod])).toBe(true);
    }
  });
});
