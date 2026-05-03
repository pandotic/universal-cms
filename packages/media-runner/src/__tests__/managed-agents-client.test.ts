import { describe, it, expect, vi } from "vitest";
import { ManagedAgentsClient, ManagedAgentsApiError } from "../managed-agents-client.js";

function jsonResponse(body: unknown, init?: { status?: number; statusText?: string }) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    headers: { "content-type": "application/json" },
  });
}

describe("ManagedAgentsClient", () => {
  it("sends the beta header on createAgent", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("anthropic-beta")).toBe("managed-agents-2026-04-01");
      expect(headers.get("x-api-key")).toBe("sk-test");
      return jsonResponse({
        id: "agt_123",
        version: 1,
        display_name: "X",
        description: null,
        instructions: "i",
        model: "claude-sonnet-4-6",
        tools: [],
        metadata: {},
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      });
    });
    const client = new ManagedAgentsClient({
      apiKey: "sk-test",
      beta: "managed-agents-2026-04-01",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const agent = await client.createAgent({
      display_name: "X",
      instructions: "i",
      model: "claude-sonnet-4-6",
    });
    expect(agent.id).toBe("agt_123");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("throws ManagedAgentsApiError on non-2xx", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: { message: "bad" } }, { status: 400, statusText: "Bad" })
    );
    const client = new ManagedAgentsClient({
      apiKey: "sk-test",
      beta: "managed-agents-2026-04-01",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.createAgent({
        display_name: "X",
        instructions: "i",
        model: "claude-sonnet-4-6",
      })
    ).rejects.toBeInstanceOf(ManagedAgentsApiError);
  });

  it("createSession references the agent id", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(JSON.parse((init?.body ?? "") as string).agent).toBe("agt_xyz");
      return jsonResponse({
        id: "sesn_1",
        agent: "agt_xyz",
        status: "running",
        stop_reason: null,
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      });
    });
    const client = new ManagedAgentsClient({
      apiKey: "sk-test",
      beta: "managed-agents-2026-04-01",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const sess = await client.createSession({ agent: "agt_xyz" });
    expect(sess.id).toBe("sesn_1");
  });

  it("listEvents includes the after cursor when supplied", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = typeof url === "string" ? url : url.toString();
      expect(u).toContain("after=ev_42");
      return jsonResponse({ data: [], has_more: false });
    });
    const client = new ManagedAgentsClient({
      apiKey: "sk-test",
      beta: "managed-agents-2026-04-01",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.listEvents({ session_id: "sesn_1", after: "ev_42" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("sendUserMessage POSTs an inputs array", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = typeof url === "string" ? url : url.toString();
      expect(u).toContain("/v1/sessions/sesn_1/inputs");
      const body = JSON.parse((init?.body ?? "") as string);
      expect(body.inputs[0].type).toBe("user_message");
      expect(body.inputs[0].text).toBe("hi");
      return jsonResponse({ ok: true });
    });
    const client = new ManagedAgentsClient({
      apiKey: "sk-test",
      beta: "managed-agents-2026-04-01",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.sendUserMessage("sesn_1", "hi");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
