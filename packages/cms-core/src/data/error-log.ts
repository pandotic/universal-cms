import type { SupabaseClient } from "@supabase/supabase-js";

export interface ErrorLogEntry {
  id: string;
  message: string;
  stack: string | null;
  url: string | null;
  component: string | null;
  severity: "info" | "warning" | "error" | "critical";
  category: "runtime" | "api" | "ui" | "build";
  fingerprint: string | null;
  count: number;
  user_agent: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

function fingerprint(message: string): string {
  // Simple fingerprint: first 100 chars of message, lowercased, spaces removed
  return message.slice(0, 100).toLowerCase().replace(/\s+/g, "");
}

export async function logError(
  client: SupabaseClient,
  entry: {
    message: string;
    stack?: string;
    url?: string;
    component?: string;
    severity?: "info" | "warning" | "error" | "critical";
    category?: "runtime" | "api" | "ui" | "build";
    user_agent?: string;
  }
): Promise<void> {
  const fp = fingerprint(entry.message);

  // Try to increment count on existing error
  const { data: existing } = await client
    .from("error_log")
    .select("id, count")
    .eq("fingerprint", fp)
    .is("resolved_at", null)
    .single();

  if (existing) {
    await client
      .from("error_log")
      .update({
        count: existing.count + 1,
        updated_at: new Date().toISOString(),
        stack: entry.stack || null,
        url: entry.url || null,
      })
      .eq("id", existing.id);
  } else {
    await client.from("error_log").insert({
      message: entry.message,
      stack: entry.stack || null,
      url: entry.url || null,
      component: entry.component || null,
      severity: entry.severity || "error",
      category: entry.category || "runtime",
      fingerprint: fp,
      user_agent: entry.user_agent || null,
    });
  }
}

export async function getErrors(
  client: SupabaseClient,
  options?: {
    severity?: string;
    category?: string;
    resolved?: boolean;
    limit?: number;
  }
): Promise<ErrorLogEntry[]> {
  let query = client
    .from("error_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.severity) query = query.eq("severity", options.severity);
  if (options?.category) query = query.eq("category", options.category);
  if (options?.resolved === false) query = query.is("resolved_at", null);
  if (options?.resolved === true) query = query.not("resolved_at", "is", null);
  query = query.limit(options?.limit ?? 100);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function resolveError(
  client: SupabaseClient,
  id: string,
  resolvedBy?: string
): Promise<void> {
  await client
    .from("error_log")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy || null,
    })
    .eq("id", id);
}
