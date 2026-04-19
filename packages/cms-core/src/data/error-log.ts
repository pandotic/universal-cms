import type { SupabaseClient } from "@supabase/supabase-js";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";
export type ErrorCategory = "runtime" | "api" | "ui" | "build";

export interface ErrorLogEntry {
  id: string;
  message: string;
  stack: string | null;
  url: string | null;
  component: string | null;
  severity: ErrorSeverity;
  category: ErrorCategory;
  fingerprint: string | null;
  count: number;
  user_agent: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogErrorInput {
  message: string;
  stack?: string | null;
  url?: string | null;
  component?: string | null;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  user_agent?: string | null;
}

export interface ListErrorsOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  resolved?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

function fingerprint(message: string, component?: string | null): string {
  const base = `${component ?? ""}::${message.slice(0, 200)}`;
  return base.toLowerCase().replace(/\s+/g, "").replace(/\d+/g, "N").slice(0, 200);
}

export async function logError(
  client: SupabaseClient,
  entry: LogErrorInput
): Promise<void> {
  const fp = fingerprint(entry.message, entry.component);

  const { data: existing } = await client
    .from("error_log")
    .select("id, count")
    .eq("fingerprint", fp)
    .is("resolved_at", null)
    .maybeSingle();

  if (existing) {
    await client
      .from("error_log")
      .update({
        count: existing.count + 1,
        updated_at: new Date().toISOString(),
        stack: entry.stack ?? null,
        url: entry.url ?? null,
      })
      .eq("id", existing.id);
  } else {
    await client.from("error_log").insert({
      message: entry.message,
      stack: entry.stack ?? null,
      url: entry.url ?? null,
      component: entry.component ?? null,
      severity: entry.severity ?? "error",
      category: entry.category ?? "runtime",
      fingerprint: fp,
      user_agent: entry.user_agent ?? null,
    });
  }
}

export async function getErrors(
  client: SupabaseClient,
  options?: ListErrorsOptions
): Promise<ErrorLogEntry[]> {
  let query = client
    .from("error_log")
    .select("*")
    .order("updated_at", { ascending: false });

  if (options?.severity) query = query.eq("severity", options.severity);
  if (options?.category) query = query.eq("category", options.category);
  if (options?.resolved === false) query = query.is("resolved_at", null);
  if (options?.resolved === true) query = query.not("resolved_at", "is", null);
  if (options?.search) query = query.ilike("message", `%${options.search}%`);

  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ErrorLogEntry[];
}

export async function getErrorById(
  client: SupabaseClient,
  id: string
): Promise<ErrorLogEntry | null> {
  const { data, error } = await client
    .from("error_log")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ErrorLogEntry | null) ?? null;
}

export async function getErrorStats(
  client: SupabaseClient
): Promise<{
  total: number;
  unresolved: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
}> {
  const { data, error } = await client
    .from("error_log")
    .select("severity, category, resolved_at");
  if (error) throw error;

  const stats = {
    total: 0,
    unresolved: 0,
    bySeverity: { info: 0, warning: 0, error: 0, critical: 0 } as Record<ErrorSeverity, number>,
    byCategory: { runtime: 0, api: 0, ui: 0, build: 0 } as Record<ErrorCategory, number>,
  };

  for (const row of (data ?? []) as Array<Pick<ErrorLogEntry, "severity" | "category" | "resolved_at">>) {
    stats.total += 1;
    if (!row.resolved_at) stats.unresolved += 1;
    stats.bySeverity[row.severity] = (stats.bySeverity[row.severity] ?? 0) + 1;
    stats.byCategory[row.category] = (stats.byCategory[row.category] ?? 0) + 1;
  }

  return stats;
}

export async function resolveError(
  client: SupabaseClient,
  id: string,
  resolvedBy?: string | null
): Promise<void> {
  const { error } = await client
    .from("error_log")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function resolveErrors(
  client: SupabaseClient,
  ids: string[],
  resolvedBy?: string | null
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await client
    .from("error_log")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy ?? null,
    })
    .in("id", ids);
  if (error) throw error;
}

export async function unresolveError(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from("error_log")
    .update({ resolved_at: null, resolved_by: null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteError(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from("error_log").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteResolvedErrors(
  client: SupabaseClient,
  olderThanDays?: number
): Promise<void> {
  let query = client.from("error_log").delete().not("resolved_at", "is", null);
  if (typeof olderThanDays === "number") {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt("resolved_at", cutoff);
  }
  const { error } = await query;
  if (error) throw error;
}

/**
 * Render an ErrorLogEntry as a Markdown bug-report snippet that's easy to
 * paste into a GitHub issue or share with an agent for triage.
 */
export function formatErrorAsMarkdown(entry: ErrorLogEntry): string {
  const lines: string[] = [];
  lines.push(`### [${entry.severity.toUpperCase()}] ${entry.message}`);
  lines.push("");
  lines.push(`- **Category:** ${entry.category}`);
  lines.push(`- **Count:** ${entry.count}`);
  if (entry.component) lines.push(`- **Component:** \`${entry.component}\``);
  if (entry.url) lines.push(`- **URL:** ${entry.url}`);
  if (entry.user_agent) lines.push(`- **User agent:** ${entry.user_agent}`);
  lines.push(`- **First seen:** ${entry.created_at}`);
  lines.push(`- **Last seen:** ${entry.updated_at}`);
  if (entry.fingerprint) lines.push(`- **Fingerprint:** \`${entry.fingerprint}\``);
  lines.push(`- **ID:** \`${entry.id}\``);
  if (entry.stack) {
    lines.push("");
    lines.push("```");
    lines.push(entry.stack.trim());
    lines.push("```");
  }
  return lines.join("\n");
}

/**
 * Render a batch of errors as a single Markdown report, grouped by severity.
 * Useful for pasting a triage list into an issue tracker or chat.
 */
export function formatErrorBatchAsMarkdown(
  entries: ErrorLogEntry[],
  options?: { title?: string }
): string {
  if (entries.length === 0) return "_No errors to report._";

  const title = options?.title ?? "Error report";
  const severityOrder: ErrorSeverity[] = ["critical", "error", "warning", "info"];
  const grouped = new Map<ErrorSeverity, ErrorLogEntry[]>();
  for (const e of entries) {
    const arr = grouped.get(e.severity) ?? [];
    arr.push(e);
    grouped.set(e.severity, arr);
  }

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`_${entries.length} issue${entries.length === 1 ? "" : "s"} — generated ${new Date().toISOString()}_`);
  lines.push("");

  for (const sev of severityOrder) {
    const rows = grouped.get(sev);
    if (!rows || rows.length === 0) continue;
    lines.push(`## ${sev.toUpperCase()} (${rows.length})`);
    lines.push("");
    for (const entry of rows) {
      lines.push(formatErrorAsMarkdown(entry));
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}
