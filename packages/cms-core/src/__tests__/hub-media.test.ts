import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Chainable mock builder matching the pattern in agents.test.ts
function createMockClient(returnData: unknown = [], returnError: null | Error = null) {
  const builder: Record<string, unknown> = {};

  const terminal = () =>
    Promise.resolve({ data: returnData, error: returnError });

  const proxy: Record<string, unknown> = new Proxy(builder, {
    get(_, prop: string) {
      if (["single", "maybeSingle"].includes(prop)) return terminal;
      if (prop === "then") {
        return (resolve: (v: unknown) => void) =>
          resolve({ data: returnData, error: returnError });
      }
      return vi.fn().mockReturnValue(proxy);
    },
  });

  return {
    client: {
      from: vi.fn().mockReturnValue(proxy),
    } as unknown as SupabaseClient,
    proxy,
  };
}

// ─── listMediaAssets ───────────────────────────────────────────────────────

describe("listMediaAssets", () => {
  let listMediaAssets: typeof import("../data/hub-media").listMediaAssets;

  beforeEach(async () => {
    vi.resetModules();
    ({ listMediaAssets } = await import("../data/hub-media"));
  });

  it("queries hub_media_assets table", async () => {
    const { client } = createMockClient([]);
    await listMediaAssets(client);
    expect(client.from).toHaveBeenCalledWith("hub_media_assets");
  });

  it("returns empty array when no data", async () => {
    const { client } = createMockClient(null);
    const result = await listMediaAssets(client);
    expect(result).toEqual([]);
  });

  it("returns asset rows", async () => {
    const rows = [{ id: "a1", pipeline_id: "p1", asset_type: "hero", provider: "gemini" }];
    const { client } = createMockClient(rows);
    const result = await listMediaAssets(client);
    expect(result).toEqual(rows);
  });

  it("throws on Supabase error", async () => {
    const { client } = createMockClient(null, new Error("db error"));
    await expect(listMediaAssets(client)).rejects.toThrow("db error");
  });
});

// ─── getMediaAssetById ─────────────────────────────────────────────────────

describe("getMediaAssetById", () => {
  let getMediaAssetById: typeof import("../data/hub-media").getMediaAssetById;

  beforeEach(async () => {
    vi.resetModules();
    ({ getMediaAssetById } = await import("../data/hub-media"));
  });

  it("queries hub_media_assets by id", async () => {
    const asset = { id: "a1", pipeline_id: "p1", asset_type: "hero" };
    const { client } = createMockClient(asset);
    const result = await getMediaAssetById(client, "a1");
    expect(client.from).toHaveBeenCalledWith("hub_media_assets");
    expect(result).toEqual(asset);
  });

  it("returns null when not found", async () => {
    const { client } = createMockClient(null);
    const result = await getMediaAssetById(client, "missing");
    expect(result).toBeNull();
  });
});

// ─── createMediaAsset ──────────────────────────────────────────────────────

describe("createMediaAsset", () => {
  let createMediaAsset: typeof import("../data/hub-media").createMediaAsset;

  beforeEach(async () => {
    vi.resetModules();
    ({ createMediaAsset } = await import("../data/hub-media"));
  });

  it("inserts into hub_media_assets and returns result", async () => {
    const newAsset = {
      id: "a1",
      pipeline_id: "p1",
      asset_type: "hero" as const,
      url: "https://example.com/hero.png",
      prompt: "A vibrant hero image",
      prompts_json: null,
      provider: "gemini" as const,
      regen_count: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const { client } = createMockClient(newAsset);
    const result = await createMediaAsset(client, {
      pipeline_id: "p1",
      asset_type: "hero",
      url: "https://example.com/hero.png",
      prompt: "A vibrant hero image",
      prompts_json: null,
      provider: "gemini",
    });
    expect(client.from).toHaveBeenCalledWith("hub_media_assets");
    expect(result).toEqual(newAsset);
  });
});

// ─── updateMediaAsset ──────────────────────────────────────────────────────

describe("updateMediaAsset", () => {
  let updateMediaAsset: typeof import("../data/hub-media").updateMediaAsset;

  beforeEach(async () => {
    vi.resetModules();
    ({ updateMediaAsset } = await import("../data/hub-media"));
  });

  it("updates hub_media_assets by id", async () => {
    const updated = { id: "a1", url: "https://example.com/new.png" };
    const { client } = createMockClient(updated);
    const result = await updateMediaAsset(client, "a1", { url: "https://example.com/new.png" });
    expect(client.from).toHaveBeenCalledWith("hub_media_assets");
    expect(result).toEqual(updated);
  });

  it("throws on Supabase error", async () => {
    const { client } = createMockClient(null, new Error("update failed"));
    await expect(
      updateMediaAsset(client, "a1", { url: "https://example.com/new.png" })
    ).rejects.toThrow("update failed");
  });
});

// ─── deleteMediaAsset ──────────────────────────────────────────────────────

describe("deleteMediaAsset", () => {
  let deleteMediaAsset: typeof import("../data/hub-media").deleteMediaAsset;

  beforeEach(async () => {
    vi.resetModules();
    ({ deleteMediaAsset } = await import("../data/hub-media"));
  });

  it("deletes from hub_media_assets by id", async () => {
    const { client } = createMockClient(null);
    await expect(deleteMediaAsset(client, "a1")).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledWith("hub_media_assets");
  });

  it("throws on Supabase error", async () => {
    const { client } = createMockClient(null, new Error("delete failed"));
    await expect(deleteMediaAsset(client, "a1")).rejects.toThrow("delete failed");
  });
});

// ─── syncApprovedMedia ─────────────────────────────────────────────────────

describe("syncApprovedMedia", () => {
  let syncApprovedMedia: typeof import("../data/hub-media").syncApprovedMedia;

  beforeEach(async () => {
    vi.resetModules();
    ({ syncApprovedMedia } = await import("../data/hub-media"));
  });

  it("returns zero counts when no approved items", async () => {
    const { client } = createMockClient([]);
    const onSyncItem = vi.fn().mockResolvedValue(undefined);
    const result = await syncApprovedMedia(client, "prop-1", onSyncItem);
    expect(result).toEqual({ synced: 0, skipped: 0, errors: [] });
    expect(onSyncItem).not.toHaveBeenCalled();
  });

  it("throws when pipeline fetch fails", async () => {
    const { client } = createMockClient(null, new Error("fetch failed"));
    const onSyncItem = vi.fn();
    await expect(syncApprovedMedia(client, "prop-1", onSyncItem)).rejects.toThrow("fetch failed");
  });

  it("queries hub_content_pipeline for approved unsynced items", async () => {
    const { client } = createMockClient([]);
    await syncApprovedMedia(client, "prop-1", vi.fn());
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
  });
});
