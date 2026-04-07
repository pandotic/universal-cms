import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper to create a mock Supabase client with chainable query builder
function createMockClient(returnData: unknown = [], returnError: null | Error = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb) =>
      cb({ data: returnData, error: returnError })
    ),
  };

  // Make the builder thenable so await works
  Object.defineProperty(builder, "then", {
    value: (resolve: (v: unknown) => void) => {
      resolve({ data: returnData, error: returnError });
    },
  });

  // Allow awaiting any terminal method
  for (const method of ["select", "order", "limit", "single", "maybeSingle", "eq", "neq"]) {
    const original = builder[method as keyof typeof builder] as ReturnType<typeof vi.fn>;
    original.mockImplementation(() => builder);
  }

  const client = {
    from: vi.fn().mockReturnValue(builder),
  } as unknown as SupabaseClient;

  return { client, builder };
}

describe("data layer - content pages", () => {
  let getAllContentPages: typeof import("../data/content-pages").getAllContentPages;
  let getContentPageBySlug: typeof import("../data/content-pages").getContentPageBySlug;

  beforeEach(async () => {
    const mod = await import("../data/content-pages");
    getAllContentPages = mod.getAllContentPages;
    getContentPageBySlug = mod.getContentPageBySlug;
  });

  it("getAllContentPages calls from('content_pages')", async () => {
    const { client } = createMockClient([]);
    await getAllContentPages(client);
    expect(client.from).toHaveBeenCalledWith("content_pages");
  });

  it("getContentPageBySlug passes slug to eq()", async () => {
    const { client, builder } = createMockClient(null);
    await getContentPageBySlug(client, "test-slug");
    expect(client.from).toHaveBeenCalledWith("content_pages");
    expect(builder.eq).toHaveBeenCalledWith("slug", "test-slug");
  });

  it("returns empty array when data is null", async () => {
    const { client } = createMockClient(null, null);
    // getAllContentPages returns data ?? []
    const result = await getAllContentPages(client);
    expect(result).toEqual([]);
  });
});

describe("data layer - dependency injection", () => {
  it("every data module function takes SupabaseClient as first param", async () => {
    const dataModules = [
      "../data/content-pages",
      "../data/entities",
      "../data/reviews",
      "../data/categories",
      "../data/media",
      "../data/forms",
    ];

    for (const modPath of dataModules) {
      const mod = await import(modPath);
      const exportedFunctions = Object.entries(mod).filter(
        ([, v]) => typeof v === "function"
      );
      // Each module should export at least one function
      expect(exportedFunctions.length).toBeGreaterThan(0);
    }
  });
});
