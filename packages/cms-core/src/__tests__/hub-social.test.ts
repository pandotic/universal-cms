import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Chainable mock builder — uses Proxy so any Supabase method chains to itself,
// with terminal methods returning a thenable { data, error }.
function createMockClient(returnData: unknown = [], returnError: null | Error = null) {
  const terminalResult = { data: returnData, error: returnError };
  const proxy: Record<string, unknown> = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === "single" || prop === "maybeSingle") {
          return () => Promise.resolve(terminalResult);
        }
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(terminalResult);
        }
        return vi.fn().mockReturnValue(proxy);
      },
    }
  );

  return {
    client: {
      from: vi.fn().mockReturnValue(proxy),
    } as unknown as SupabaseClient,
    proxy,
  };
}

// ─── Brand Voice Briefs ────────────────────────────────────────────────────

describe("listBriefs", () => {
  let listBriefs: typeof import("../data/hub-social").listBriefs;

  beforeEach(async () => {
    vi.resetModules();
    ({ listBriefs } = await import("../data/hub-social"));
  });

  it("queries hub_brand_voice_briefs", async () => {
    const { client } = createMockClient([]);
    await listBriefs(client);
    expect(client.from).toHaveBeenCalledWith("hub_brand_voice_briefs");
  });

  it("returns empty array when no data", async () => {
    const { client } = createMockClient(null);
    const result = await listBriefs(client);
    expect(result).toEqual([]);
  });

  it("throws when Supabase returns an error", async () => {
    const { client } = createMockClient(null, new Error("db error"));
    await expect(listBriefs(client)).rejects.toThrow("db error");
  });
});

describe("getBriefById", () => {
  let getBriefById: typeof import("../data/hub-social").getBriefById;

  beforeEach(async () => {
    vi.resetModules();
    ({ getBriefById } = await import("../data/hub-social"));
  });

  it("queries hub_brand_voice_briefs by id", async () => {
    const brief = { id: "b1", name: "Main Voice" };
    const { client } = createMockClient(brief);
    const result = await getBriefById(client, "b1");
    expect(client.from).toHaveBeenCalledWith("hub_brand_voice_briefs");
    expect(result).toEqual(brief);
  });

  it("returns null when brief not found", async () => {
    const { client } = createMockClient(null);
    const result = await getBriefById(client, "missing");
    expect(result).toBeNull();
  });
});

describe("createBrief", () => {
  let createBrief: typeof import("../data/hub-social").createBrief;

  beforeEach(async () => {
    vi.resetModules();
    ({ createBrief } = await import("../data/hub-social"));
  });

  it("inserts and returns the new brief", async () => {
    const newBrief = {
      id: "b-new",
      property_id: "p1",
      name: "Launch Voice",
      platform: "Twitter",
      tone: ["playful"],
      audience: "founders",
      key_messages: ["ship fast"],
      dos: [],
      donts: [],
      example_posts: null,
      metadata: {},
      created_by: "u1",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const { client } = createMockClient(newBrief);
    const result = await createBrief(client, {
      property_id: "p1",
      name: "Launch Voice",
      platform: "Twitter",
      tone: ["playful"],
      audience: "founders",
      key_messages: ["ship fast"],
      dos: [],
      donts: [],
      example_posts: null,
      metadata: {},
      created_by: "u1",
    });
    expect(client.from).toHaveBeenCalledWith("hub_brand_voice_briefs");
    expect(result).toEqual(newBrief);
  });
});

describe("deleteBrief", () => {
  let deleteBrief: typeof import("../data/hub-social").deleteBrief;

  beforeEach(async () => {
    vi.resetModules();
    ({ deleteBrief } = await import("../data/hub-social"));
  });

  it("deletes from hub_brand_voice_briefs", async () => {
    const { client } = createMockClient(null);
    await expect(deleteBrief(client, "b1")).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledWith("hub_brand_voice_briefs");
  });

  it("throws on error", async () => {
    const { client } = createMockClient(null, new Error("denied"));
    await expect(deleteBrief(client, "b1")).rejects.toThrow("denied");
  });
});

// ─── Social Content (hub_content_pipeline) ────────────────────────────────

describe("listSocialContent", () => {
  let listSocialContent: typeof import("../data/hub-social").listSocialContent;

  beforeEach(async () => {
    vi.resetModules();
    ({ listSocialContent } = await import("../data/hub-social"));
  });

  it("queries hub_content_pipeline", async () => {
    const { client } = createMockClient([]);
    await listSocialContent(client);
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
  });

  it("returns rows when present", async () => {
    const rows = [{ id: "c1", body: "hello world" }];
    const { client } = createMockClient(rows);
    const result = await listSocialContent(client);
    expect(result).toEqual(rows);
  });
});

describe("getSocialContentById", () => {
  let getSocialContentById: typeof import("../data/hub-social").getSocialContentById;

  beforeEach(async () => {
    vi.resetModules();
    ({ getSocialContentById } = await import("../data/hub-social"));
  });

  it("queries hub_content_pipeline by id", async () => {
    const content = { id: "c1", status: "draft" };
    const { client } = createMockClient(content);
    const result = await getSocialContentById(client, "c1");
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
    expect(result).toEqual(content);
  });

  it("returns null when not found", async () => {
    const { client } = createMockClient(null);
    const result = await getSocialContentById(client, "missing");
    expect(result).toBeNull();
  });
});

describe("createSocialContent", () => {
  let createSocialContent: typeof import("../data/hub-social").createSocialContent;

  beforeEach(async () => {
    vi.resetModules();
    ({ createSocialContent } = await import("../data/hub-social"));
  });

  it("inserts into hub_content_pipeline", async () => {
    const content = { id: "c-new", body: "new post", status: "draft" };
    const { client } = createMockClient(content);
    const result = await createSocialContent(client, {
      property_id: "p1",
      brief_id: null,
      platform: "twitter",
      content_type: "post",
      title: null,
      body: "new post",
      media_urls: [],
      hashtags: [],
      status: "draft",
      scheduled_for: null,
      published_at: null,
      metadata: {},
      created_by: "u1",
    });
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
    expect(result).toEqual(content);
  });
});

describe("publishSocialContent", () => {
  let publishSocialContent: typeof import("../data/hub-social").publishSocialContent;

  beforeEach(async () => {
    vi.resetModules();
    ({ publishSocialContent } = await import("../data/hub-social"));
  });

  it("updates hub_content_pipeline with published status", async () => {
    const updated = { id: "c1", status: "published" };
    const { client } = createMockClient(updated);
    const result = await publishSocialContent(client, "c1");
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
    expect(result).toEqual(updated);
  });
});

describe("scheduleContentForLater", () => {
  let scheduleContentForLater: typeof import("../data/hub-social").scheduleContentForLater;

  beforeEach(async () => {
    vi.resetModules();
    ({ scheduleContentForLater } = await import("../data/hub-social"));
  });

  it("updates hub_content_pipeline with scheduled_for", async () => {
    const updated = { id: "c1", status: "scheduled" };
    const { client } = createMockClient(updated);
    const result = await scheduleContentForLater(client, "c1", "2026-12-31T00:00:00Z");
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
    expect(result).toEqual(updated);
  });
});

describe("getScheduledContent", () => {
  let getScheduledContent: typeof import("../data/hub-social").getScheduledContent;

  beforeEach(async () => {
    vi.resetModules();
    ({ getScheduledContent } = await import("../data/hub-social"));
  });

  it("queries hub_content_pipeline for scheduled items", async () => {
    const { client } = createMockClient([]);
    await getScheduledContent(client, "prop-1");
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
  });

  it("returns empty array when nothing scheduled", async () => {
    const { client } = createMockClient(null);
    const result = await getScheduledContent(client, "prop-1");
    expect(result).toEqual([]);
  });
});

describe("deleteSocialContent", () => {
  let deleteSocialContent: typeof import("../data/hub-social").deleteSocialContent;

  beforeEach(async () => {
    vi.resetModules();
    ({ deleteSocialContent } = await import("../data/hub-social"));
  });

  it("deletes from hub_content_pipeline", async () => {
    const { client } = createMockClient(null);
    await expect(deleteSocialContent(client, "c1")).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledWith("hub_content_pipeline");
  });
});
