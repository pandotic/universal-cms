// Thin raw-fetch wrapper around the Anthropic Managed Agents beta REST API.
// Encapsulated here so when @anthropic-ai/sdk gains client.beta.agents
// support we can swap implementations behind the same interface.
//
// Beta header: managed-agents-2026-04-01

const BASE_URL = "https://api.anthropic.com";

export interface ManagedAgentsClientOptions {
  apiKey: string;
  beta: string;
  fetchImpl?: typeof fetch;
}

export interface CreateAgentInput {
  display_name: string;
  description?: string;
  instructions: string;
  model: string;
  tools?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface AgentObject {
  id: string;          // agt_...
  version: number;
  display_name: string;
  description: string | null;
  instructions: string;
  model: string;
  tools: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionInput {
  agent: string;        // agt_... or "agent_id:version"
  inputs?: Array<{
    type: "user_message" | "file";
    [key: string]: unknown;
  }>;
  vault_ids?: string[];
  environment_id?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionObject {
  id: string;          // sesn_...
  agent: string;
  status: "pending" | "running" | "idle" | "completed" | "failed" | "cancelled";
  stop_reason: { type: string; [key: string]: unknown } | null;
  created_at: string;
  updated_at: string;
}

export interface SessionEvent {
  id: string;          // ev_...
  session_id: string;
  type: string;        // e.g. "agent.message", "session.status_idle", etc.
  data: Record<string, unknown>;
  created_at: string;
}

export interface ListEventsInput {
  session_id: string;
  after?: string;
  limit?: number;
}

export class ManagedAgentsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ManagedAgentsApiError";
  }
}

export class ManagedAgentsClient {
  private readonly apiKey: string;
  private readonly beta: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ManagedAgentsClientOptions) {
    this.apiKey = opts.apiKey;
    this.beta = opts.beta;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    return {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": this.beta,
      "content-type": "application/json",
    };
  }

  private async request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await this.fetchImpl(`${BASE_URL}${path}`, {
      method,
      headers: this.headers(),
      body: body == null ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      let parsed: unknown = undefined;
      try {
        parsed = await res.json();
      } catch {
        // ignore — body wasn't JSON
      }
      throw new ManagedAgentsApiError(
        res.status,
        `${method} ${path} → ${res.status} ${res.statusText}`,
        parsed
      );
    }
    return (await res.json()) as T;
  }

  // ─── Agents ──────────────────────────────────────────────────────────

  async createAgent(input: CreateAgentInput): Promise<AgentObject> {
    return this.request<AgentObject>("POST", "/v1/agents", input);
  }

  async getAgent(id: string): Promise<AgentObject> {
    return this.request<AgentObject>("GET", `/v1/agents/${id}`);
  }

  async updateAgent(id: string, input: Partial<CreateAgentInput>): Promise<AgentObject> {
    return this.request<AgentObject>("POST", `/v1/agents/${id}`, input);
  }

  // ─── Sessions ────────────────────────────────────────────────────────

  async createSession(input: CreateSessionInput): Promise<SessionObject> {
    return this.request<SessionObject>("POST", "/v1/sessions", input);
  }

  async getSession(id: string): Promise<SessionObject> {
    return this.request<SessionObject>("GET", `/v1/sessions/${id}`);
  }

  async cancelSession(id: string): Promise<SessionObject> {
    return this.request<SessionObject>("POST", `/v1/sessions/${id}/cancel`);
  }

  /**
   * Push an incremental user_message into a running session. Used after
   * createSession (without inputs) to send the kickoff prompt.
   */
  async sendUserMessage(sessionId: string, text: string): Promise<void> {
    await this.request<{ ok: true }>("POST", `/v1/sessions/${sessionId}/inputs`, {
      inputs: [{ type: "user_message", text }],
    });
  }

  /**
   * Submit a host-side custom tool result back into the session.
   * Used by Pattern 9 in PR 3 (Gemini / HeyGen tool handlers).
   */
  async sendToolResult(
    sessionId: string,
    toolUseId: string,
    output: unknown
  ): Promise<void> {
    await this.request<{ ok: true }>("POST", `/v1/sessions/${sessionId}/inputs`, {
      inputs: [
        {
          type: "tool_result",
          tool_use_id: toolUseId,
          output,
        },
      ],
    });
  }

  // ─── Events (history fetch — used by Pattern 1 lossless reconnect) ───

  async listEvents(input: ListEventsInput): Promise<{ data: SessionEvent[]; has_more: boolean }> {
    const qs = new URLSearchParams();
    if (input.after) qs.set("after", input.after);
    if (input.limit != null) qs.set("limit", String(input.limit));
    const query = qs.toString();
    return this.request<{ data: SessionEvent[]; has_more: boolean }>(
      "GET",
      `/v1/sessions/${input.session_id}/events${query ? `?${query}` : ""}`
    );
  }

  // ─── SSE stream ──────────────────────────────────────────────────────

  /**
   * Opens an SSE stream for the session's events. Returns an async iterable
   * that yields SessionEvent objects in order. Caller is responsible for
   * closing via the returned `close()` callback (or aborting via signal).
   *
   * Designed for Pattern 7 (open before kickoff) — caller should call this
   * and start iterating BEFORE sending any user_message.
   */
  async openEventStream(
    sessionId: string,
    opts?: { signal?: AbortSignal; lastEventId?: string }
  ): Promise<{
    events: AsyncIterable<SessionEvent>;
    close: () => void;
  }> {
    const url = new URL(`${BASE_URL}/v1/sessions/${sessionId}/events/stream`);
    const headers: Record<string, string> = {
      ...this.headers(),
      accept: "text/event-stream",
    };
    if (opts?.lastEventId) {
      headers["last-event-id"] = opts.lastEventId;
    }

    const res = await this.fetchImpl(url, { headers, signal: opts?.signal });
    if (!res.ok || !res.body) {
      throw new ManagedAgentsApiError(
        res.status,
        `SSE stream open failed: ${res.status} ${res.statusText}`
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let closed = false;

    const close = (): void => {
      closed = true;
      reader.cancel().catch(() => {});
    };

    async function* iterate(): AsyncIterable<SessionEvent> {
      while (!closed) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });

        // SSE frame boundary is a blank line (CRLF or LF)
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          let data = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            }
            // ignore id:/event:/retry: — id is mirrored inside data.id
          }
          if (data.length === 0) continue;
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as SessionEvent;
            yield parsed;
          } catch {
            // Skip malformed frames rather than crash the stream.
          }
        }
      }
    }

    return { events: iterate(), close };
  }
}
