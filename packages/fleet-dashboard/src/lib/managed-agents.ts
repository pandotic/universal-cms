/**
 * Anthropic Managed Agents helper for fleet-dashboard server-side use.
 *
 * The Hub itself rarely talks to Anthropic directly — that's the runner's job.
 * But two surfaces need it:
 *   1. /api/agents/[id]/runs → enqueue endpoint (writes hub_agent_runs row)
 *   2. /api/webhooks/agent-run extension → optionally cancel a session
 *
 * Both use the same beta REST surface as packages/media-runner. This module
 * provides a single thin client + the canonical beta header constant so call
 * sites stay consistent.
 *
 * NOTE: SDK 0.39 doesn't expose client.beta.agents/sessions yet; once it
 * does, swap the implementation here without touching consumers.
 */

export const MANAGED_AGENTS_BETA = "managed-agents-2026-04-01";

const BASE_URL = "https://api.anthropic.com";

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

export interface ManagedAgentRecord {
  id: string;
  version: number;
}

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to fleet-dashboard env (Netlify or .env.local)."
    );
  }
  return key;
}

async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
      "anthropic-beta": MANAGED_AGENTS_BETA,
      "content-type": "application/json",
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let parsed: unknown = undefined;
    try {
      parsed = await res.json();
    } catch {
      // ignore
    }
    throw new ManagedAgentsApiError(
      res.status,
      `${method} ${path} → ${res.status} ${res.statusText}`,
      parsed
    );
  }
  return (await res.json()) as T;
}

/**
 * Cancel a running session — used when the user hits "stop" on a running
 * hub_agent_runs row in the Hub UI.
 */
export async function cancelManagedSession(sessionId: string): Promise<void> {
  await request<{ id: string; status: string }>(
    "POST",
    `/v1/sessions/${sessionId}/cancel`
  );
}

/**
 * Look up a Managed Agent by ID — exposed for the future "What model is this
 * agent on?" UI panel.
 */
export async function getManagedAgent(
  agentId: string
): Promise<ManagedAgentRecord & { model: string; display_name: string }> {
  return request<ManagedAgentRecord & { model: string; display_name: string }>(
    "GET",
    `/v1/agents/${agentId}`
  );
}
