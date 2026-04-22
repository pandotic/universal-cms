import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Chainable mock builder — mirrors the pattern in data-layer.test.ts
function createMockClient(returnData: unknown = [], returnError: null | Error = null) {
  const builder: Record<string, unknown> = {};

  const terminal = () =>
    Promise.resolve({ data: returnData, error: returnError });

  const chainable = () => proxy;
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

// ─── listAgents ────────────────────────────────────────────────────────────

describe("listAgents", () => {
  let listAgents: typeof import("../data/hub-agents").listAgents;

  beforeEach(async () => {
    vi.resetModules();
    ({ listAgents } = await import("../data/hub-agents"));
  });

  it("queries hub_agents table", async () => {
    const { client } = createMockClient([]);
    await listAgents(client);
    expect(client.from).toHaveBeenCalledWith("hub_agents");
  });

  it("returns empty array when no data", async () => {
    const { client } = createMockClient(null);
    const result = await listAgents(client);
    expect(result).toEqual([]);
  });

  it("returns data array when rows exist", async () => {
    const rows = [{ id: "1", name: "SEO Agent", agent_type: "seo_audit" }];
    const { client } = createMockClient(rows);
    const result = await listAgents(client);
    expect(result).toEqual(rows);
  });

  it("throws when Supabase returns an error", async () => {
    const { client } = createMockClient(null, new Error("db error"));
    await expect(listAgents(client)).rejects.toThrow("db error");
  });
});

// ─── getAgentById ──────────────────────────────────────────────────────────

describe("getAgentById", () => {
  let getAgentById: typeof import("../data/hub-agents").getAgentById;

  beforeEach(async () => {
    vi.resetModules();
    ({ getAgentById } = await import("../data/hub-agents"));
  });

  it("queries hub_agents by id", async () => {
    const agent = { id: "abc", name: "Test" };
    const { client } = createMockClient(agent);
    const result = await getAgentById(client, "abc");
    expect(client.from).toHaveBeenCalledWith("hub_agents");
    expect(result).toEqual(agent);
  });

  it("returns null when agent not found", async () => {
    const { client } = createMockClient(null);
    const result = await getAgentById(client, "missing");
    expect(result).toBeNull();
  });
});

// ─── createAgent ───────────────────────────────────────────────────────────

describe("createAgent", () => {
  let createAgent: typeof import("../data/hub-agents").createAgent;

  beforeEach(async () => {
    vi.resetModules();
    ({ createAgent } = await import("../data/hub-agents"));
  });

  it("inserts into hub_agents and returns result", async () => {
    const newAgent = {
      id: "new-id",
      name: "My Agent",
      slug: "my-agent",
      description: null,
      agent_type: "seo_audit" as const,
      config: {},
      enabled: true,
      schedule: null,
      property_id: "prop-1",
      created_by: "user-1",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const { client } = createMockClient(newAgent);
    const result = await createAgent(client, {
      name: "My Agent",
      slug: "my-agent",
      description: null,
      agent_type: "seo_audit",
      config: {},
      enabled: true,
      schedule: null,
      property_id: "prop-1",
      created_by: "user-1",
    });
    expect(client.from).toHaveBeenCalledWith("hub_agents");
    expect(result).toEqual(newAgent);
  });
});

// ─── listAgentRuns ─────────────────────────────────────────────────────────

describe("listAgentRuns", () => {
  let listAgentRuns: typeof import("../data/hub-agents").listAgentRuns;

  beforeEach(async () => {
    vi.resetModules();
    ({ listAgentRuns } = await import("../data/hub-agents"));
  });

  it("queries hub_agent_runs by agentId", async () => {
    const { client } = createMockClient([]);
    await listAgentRuns(client, "agent-123");
    expect(client.from).toHaveBeenCalledWith("hub_agent_runs");
  });

  it("returns empty array when no runs", async () => {
    const { client } = createMockClient(null);
    const result = await listAgentRuns(client, "agent-123");
    expect(result).toEqual([]);
  });
});

// ─── createAgentRun ────────────────────────────────────────────────────────

describe("createAgentRun", () => {
  let createAgentRun: typeof import("../data/hub-agents").createAgentRun;

  beforeEach(async () => {
    vi.resetModules();
    ({ createAgentRun } = await import("../data/hub-agents"));
  });

  it("inserts into hub_agent_runs", async () => {
    const run = {
      id: "run-1",
      agent_id: "agent-1",
      status: "pending",
      triggered_by: "manual",
      property_id: "prop-1",
      started_at: null,
      completed_at: null,
      result: null,
      error_message: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const { client } = createMockClient(run);
    const result = await createAgentRun(client, {
      agent_id: "agent-1",
      status: "pending",
      triggered_by: "manual",
      property_id: "prop-1",
      started_at: null,
      completed_at: null,
      result: null,
      error_message: null,
    });
    expect(client.from).toHaveBeenCalledWith("hub_agent_runs");
    expect(result).toEqual(run);
  });
});

// ─── getLatestAgentRun ─────────────────────────────────────────────────────

describe("getLatestAgentRun", () => {
  let getLatestAgentRun: typeof import("../data/hub-agents").getLatestAgentRun;

  beforeEach(async () => {
    vi.resetModules();
    ({ getLatestAgentRun } = await import("../data/hub-agents"));
  });

  it("queries hub_agent_runs for the latest run", async () => {
    const run = { id: "run-latest", status: "completed" };
    const { client } = createMockClient(run);
    const result = await getLatestAgentRun(client, "agent-1");
    expect(client.from).toHaveBeenCalledWith("hub_agent_runs");
    expect(result).toEqual(run);
  });

  it("returns null when no runs exist", async () => {
    const { client } = createMockClient(null);
    const result = await getLatestAgentRun(client, "agent-1");
    expect(result).toBeNull();
  });
});

// ─── deleteAgent ───────────────────────────────────────────────────────────

describe("deleteAgent", () => {
  let deleteAgent: typeof import("../data/hub-agents").deleteAgent;

  beforeEach(async () => {
    vi.resetModules();
    ({ deleteAgent } = await import("../data/hub-agents"));
  });

  it("deletes from hub_agents by id", async () => {
    const { client } = createMockClient(null);
    await expect(deleteAgent(client, "agent-1")).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledWith("hub_agents");
  });

  it("throws when Supabase returns an error", async () => {
    const { client } = createMockClient(null, new Error("delete failed"));
    await expect(deleteAgent(client, "agent-1")).rejects.toThrow("delete failed");
  });
});
