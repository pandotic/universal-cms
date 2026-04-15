"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  property_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // admin_audit_log fields
  resource_type?: string;
  resource_id?: string | null;
  changes?: Record<string, unknown>;
  action_type?: string;
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  updated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deleted: "bg-red-500/10 text-red-400 border-red-500/20",
  bootstrap_first_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function getActionColor(action: string): string {
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return cls;
  }
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"hub" | "admin">("hub");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const supabase = createClient();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (source === "hub") {
        let query = supabase
          .from("hub_activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (actionFilter) query = query.ilike("action", `%${actionFilter}%`);
        if (entityFilter) query = query.ilike("entity_type", `%${entityFilter}%`);

        const { data, error: err } = await query;
        if (err) throw err;
        setEntries(data ?? []);
      } else {
        let query = supabase
          .from("admin_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (actionFilter) query = query.ilike("action_type", `%${actionFilter}%`);

        const { data, error: err } = await query;
        if (err) throw err;
        setEntries(
          (data ?? []).map((d: Record<string, unknown>) => ({
            ...d,
            action: (d.action_type as string) ?? "",
            entity_type: (d.target_type as string) ?? "",
            entity_id: (d.target_id as string) ?? null,
            description: null,
          })) as AuditEntry[]
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [source, actionFilter, entityFilter, supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Platform-wide action history and activity tracking
        </p>
      </div>

      {/* Source tabs + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            onClick={() => setSource("hub")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              source === "hub"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Hub Activity
          </button>
          <button
            onClick={() => setSource("admin")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              source === "admin"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Admin Audit
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          {source === "hub" && (
            <input
              type="text"
              placeholder="Filter by entity..."
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">No audit log entries found</p>
        </div>
      )}

      {/* Entries list */}
      {!loading && entries.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {entries.map((entry) => (
              <div key={entry.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getActionColor(entry.action)}`}
                      >
                        {entry.action}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {entry.entity_type}
                        {entry.entity_id && (
                          <span className="ml-1 text-zinc-600">
                            #{entry.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {entry.description}
                      </p>
                    )}
                    {entry.changes &&
                      Object.keys(entry.changes).length > 0 && (
                        <pre className="mt-2 max-h-24 overflow-auto rounded bg-zinc-950 p-2 text-xs text-zinc-500">
                          {JSON.stringify(entry.changes, null, 2)}
                        </pre>
                      )}
                  </div>
                  <time className="shrink-0 text-xs text-zinc-600">
                    {new Date(entry.created_at).toLocaleString()}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
