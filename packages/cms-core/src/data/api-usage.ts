import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ApiProvider =
  | "anthropic"
  | "openai"
  | "google"
  | "supabase"
  | "netlify"
  | "vercel"
  | "stripe"
  | "custom";

export interface ApiUsageRecord {
  id: string;
  provider: ApiProvider;
  endpoint: string;
  method: string;
  status_code: number;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;
  latency_ms: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApiUsageSummary {
  provider: ApiProvider;
  totalRequests: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  errorCount: number;
}

export interface ApiKeyRecord {
  id: string;
  provider: ApiProvider;
  key_name: string;
  key_hint: string; // last 4 chars only, e.g. "...a1b2"
  environment: "production" | "staging" | "development";
  project_name: string;
  is_active: boolean;
  monthly_budget_usd: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAuditEntry {
  id: string;
  provider: ApiProvider;
  period_start: string;
  period_end: string;
  self_reported_cost_usd: number;
  vendor_invoice_cost_usd: number | null;
  discrepancy_usd: number | null;
  status: "pending" | "matched" | "discrepancy" | "resolved";
  notes: string | null;
  created_at: string;
}

// ─── In-Memory Usage Tracker (per-process) ──────────────────────────────────
// Tracks API calls in memory and periodically flushes to Supabase.
// This avoids adding latency to every API call.

interface UsageEntry {
  provider: ApiProvider;
  endpoint: string;
  method: string;
  statusCode: number;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

let usageBuffer: UsageEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

/** Record an API call. Buffered in memory and flushed periodically. */
export function trackApiCall(entry: UsageEntry): void {
  usageBuffer.push(entry);
}

/** Flush buffered usage records to Supabase. Call on a schedule or at shutdown. */
export async function flushApiUsage(client: SupabaseClient): Promise<number> {
  if (usageBuffer.length === 0) return 0;

  const batch = usageBuffer.splice(0, usageBuffer.length);
  const rows = batch.map((e) => ({
    provider: e.provider,
    endpoint: e.endpoint,
    method: e.method,
    status_code: e.statusCode,
    tokens_input: e.tokensInput ?? null,
    tokens_output: e.tokensOutput ?? null,
    cost_usd: e.costUsd ?? null,
    latency_ms: e.latencyMs,
    metadata: e.metadata ?? {},
  }));

  const { error } = await client.from("api_usage").insert(rows);
  if (error) {
    // Put records back if flush failed
    usageBuffer.unshift(...batch);
    throw error;
  }

  return batch.length;
}

/** Start auto-flushing every N milliseconds. Returns a stop function. */
export function startAutoFlush(
  client: SupabaseClient,
  intervalMs = 60_000
): () => void {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => {
    flushApiUsage(client).catch(console.error);
  }, intervalMs);

  return () => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  };
}

// ─── Query Functions ────────────────────────────────────────────────────────

/** Get usage summary grouped by provider for a date range */
export async function getUsageSummary(
  client: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<ApiUsageSummary[]> {
  const { data, error } = await client
    .from("api_usage")
    .select("provider, status_code, tokens_input, tokens_output, cost_usd, latency_ms")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const byProvider = new Map<string, ApiUsageSummary>();

  for (const row of data) {
    const key = row.provider as ApiProvider;
    let summary = byProvider.get(key);
    if (!summary) {
      summary = {
        provider: key,
        totalRequests: 0,
        totalTokensInput: 0,
        totalTokensOutput: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
        errorCount: 0,
      };
      byProvider.set(key, summary);
    }
    summary.totalRequests++;
    summary.totalTokensInput += row.tokens_input ?? 0;
    summary.totalTokensOutput += row.tokens_output ?? 0;
    summary.totalCostUsd += row.cost_usd ?? 0;
    summary.avgLatencyMs += row.latency_ms ?? 0;
    if (row.status_code >= 400) summary.errorCount++;
  }

  // Finalize averages
  for (const summary of byProvider.values()) {
    summary.avgLatencyMs = Math.round(summary.avgLatencyMs / summary.totalRequests);
  }

  return [...byProvider.values()].sort((a, b) => b.totalCostUsd - a.totalCostUsd);
}

/** Get raw usage records (paginated) */
export async function getUsageRecords(
  client: SupabaseClient,
  options?: {
    provider?: ApiProvider;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ records: ApiUsageRecord[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = client.from("api_usage").select("*", { count: "exact" });

  if (options?.provider) query = query.eq("provider", options.provider);
  if (options?.startDate) query = query.gte("created_at", options.startDate);
  if (options?.endDate) query = query.lte("created_at", options.endDate);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { records: data ?? [], total: count ?? 0 };
}

// ─── API Keys ───────────────────────────────────────────────────────────────

export async function getAllApiKeys(client: SupabaseClient): Promise<ApiKeyRecord[]> {
  const { data, error } = await client
    .from("api_keys")
    .select("*")
    .order("provider")
    .order("project_name");

  if (error) throw error;
  return data ?? [];
}

export async function upsertApiKey(
  client: SupabaseClient,
  key: Partial<ApiKeyRecord>
): Promise<ApiKeyRecord> {
  const { data, error } = await client
    .from("api_keys")
    .upsert(key, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteApiKey(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("api_keys").delete().eq("id", id);
  if (error) throw error;
}

// ─── Audit / Reconciliation ─────────────────────────────────────────────────

export async function getAuditEntries(
  client: SupabaseClient,
  options?: { provider?: ApiProvider; status?: ApiAuditEntry["status"] }
): Promise<ApiAuditEntry[]> {
  let query = client.from("api_audit").select("*");

  if (options?.provider) query = query.eq("provider", options.provider);
  if (options?.status) query = query.eq("status", options.status);

  const { data, error } = await query.order("period_start", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAuditEntry(
  client: SupabaseClient,
  entry: Partial<ApiAuditEntry>
): Promise<ApiAuditEntry> {
  const { data, error } = await client
    .from("api_audit")
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAuditEntry(
  client: SupabaseClient,
  id: string,
  updates: Partial<ApiAuditEntry>
): Promise<ApiAuditEntry> {
  const { data, error } = await client
    .from("api_audit")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
