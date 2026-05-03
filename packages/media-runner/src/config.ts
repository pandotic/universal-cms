// Reads + validates env once at boot. Throws with a clear list of missing
// vars rather than failing later inside an HTTP call.

export interface RunnerConfig {
  anthropicApiKey: string;
  anthropicBeta: string;
  hubSupabaseUrl: string;
  hubServiceRoleKey: string;
  pollIntervalMs: number;
  maxStreamReconnects: number;
  logLevel: "debug" | "info" | "warn" | "error";
  // Filter: which agent_types this runner instance will claim. Defaults to
  // ["long_form_writer"] for the PR 2 pilot. PR 3 adds "media_generator".
  agentTypes: string[];
}

export function loadConfig(): RunnerConfig {
  const missing: string[] = [];

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!anthropicApiKey) missing.push("ANTHROPIC_API_KEY");

  const hubSupabaseUrl = process.env.HUB_SUPABASE_URL ?? "";
  if (!hubSupabaseUrl) missing.push("HUB_SUPABASE_URL");

  const hubServiceRoleKey = process.env.HUB_SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!hubServiceRoleKey) missing.push("HUB_SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(", ")}. ` +
        `Set them via 'fly secrets set ...' or your local shell.`
    );
  }

  const pollIntervalMs = Number.parseInt(
    process.env.RUNNER_POLL_INTERVAL_MS ?? "5000",
    10
  );
  if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 500) {
    throw new Error(
      `RUNNER_POLL_INTERVAL_MS must be an integer >= 500 (got: ${process.env.RUNNER_POLL_INTERVAL_MS})`
    );
  }

  const maxStreamReconnects = Number.parseInt(
    process.env.RUNNER_MAX_STREAM_RECONNECTS ?? "5",
    10
  );

  const rawLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  const logLevel: RunnerConfig["logLevel"] =
    rawLevel === "debug" || rawLevel === "warn" || rawLevel === "error"
      ? rawLevel
      : "info";

  const rawAgentTypes = process.env.RUNNER_AGENT_TYPES ?? "long_form_writer";
  const agentTypes = rawAgentTypes
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return {
    anthropicApiKey,
    anthropicBeta: process.env.ANTHROPIC_BETA ?? "managed-agents-2026-04-01",
    hubSupabaseUrl,
    hubServiceRoleKey,
    pollIntervalMs,
    maxStreamReconnects,
    logLevel,
    agentTypes,
  };
}
