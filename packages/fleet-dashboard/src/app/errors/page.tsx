"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatErrorAsMarkdown,
  formatErrorBatchAsMarkdown,
  type ErrorCategory,
  type ErrorLogEntry,
  type ErrorSeverity,
} from "@pandotic/universal-cms/data/errors";

const SEVERITIES: (ErrorSeverity | "all")[] = [
  "all",
  "critical",
  "error",
  "warning",
  "info",
];
const CATEGORIES: (ErrorCategory | "all")[] = [
  "all",
  "runtime",
  "api",
  "ui",
  "build",
];

const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  error: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const CATEGORY_COLORS: Record<ErrorCategory, string> = {
  runtime: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  api: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  ui: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  build: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export default function ErrorsPage() {
  const [entries, setEntries] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<ErrorSeverity | "all">("all");
  const [category, setCategory] = useState<ErrorCategory | "all">("all");
  const [showResolved, setShowResolved] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (severity !== "all") params.set("severity", severity);
      if (category !== "all") params.set("category", category);
      params.set("resolved", showResolved ? "true" : "false");
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "200");

      const res = await fetch(`/api/errors?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load errors (${res.status})`);
      const json = (await res.json()) as { data: ErrorLogEntry[] };
      setEntries(json.data ?? []);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load errors");
    } finally {
      setLoading(false);
    }
  }, [severity, category, showResolved, search]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    entries.length > 0 && entries.every((e) => selected.has(e.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(entries.map((e) => e.id)));
  };

  const selectedEntries = useMemo(
    () => entries.filter((e) => selected.has(e.id)),
    [entries, selected]
  );

  async function resolveSelected() {
    if (selected.size === 0) return;
    const res = await fetch("/api/errors/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    if (!res.ok) {
      setError(`Failed to resolve (${res.status})`);
      return;
    }
    await fetchEntries();
  }

  async function toggleResolved(entry: ErrorLogEntry) {
    const res = await fetch(`/api/errors/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: !entry.resolved_at }),
    });
    if (!res.ok) {
      setError(`Failed to update (${res.status})`);
      return;
    }
    await fetchEntries();
  }

  async function copyReport(items: ErrorLogEntry[]) {
    const md = formatErrorBatchAsMarkdown(items, {
      title: `Error batch (${items.length})`,
    });
    setReportText(md);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked — user can still copy from the preview.
    }
  }

  async function copySingle(entry: ErrorLogEntry) {
    const md = formatErrorAsMarkdown(entry);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setReportText(md);
    }
  }

  function downloadReport(items: ErrorLogEntry[]) {
    const md = formatErrorBatchAsMarkdown(items, {
      title: `Error batch (${items.length})`,
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `errors-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Errors
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Auto-captured runtime, API, UI and build errors. Batch-resolve and
            copy as Markdown to hand off to an agent or paste into an issue.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyReport(entries)}
            disabled={entries.length === 0}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy all as Markdown
          </button>
          <button
            onClick={() => downloadReport(entries)}
            disabled={entries.length === 0}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download .md
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as ErrorSeverity | "all")}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All severities" : s}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ErrorCategory | "all")}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Show resolved
        </label>
        <input
          type="text"
          placeholder="Search message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-500"
        />
        <button
          onClick={() => void fetchEntries()}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/5 px-4 py-2">
          <span className="text-sm text-violet-300">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => void copyReport(selectedEntries)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-800"
          >
            Copy selected as Markdown
          </button>
          <button
            onClick={() => downloadReport(selectedEntries)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-800"
          >
            Download
          </button>
          <button
            onClick={() => void resolveSelected()}
            className="rounded-md border border-emerald-700 bg-emerald-900/30 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-900/50"
          >
            Mark resolved
          </button>
        </div>
      )}

      {copied && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-300">
          Copied to clipboard.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No errors matching these filters. Nothing to report.
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/50 px-4 py-2 text-xs uppercase tracking-wide text-zinc-500">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5"
            />
            <span className="flex-1">Message</span>
            <span className="hidden w-20 text-right sm:inline">Count</span>
            <span className="hidden w-40 text-right sm:inline">Last seen</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const isChecked = selected.has(entry.id);
              return (
                <div key={entry.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelected(entry.id)}
                      className="mt-1 h-3.5 w-3.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${SEVERITY_COLORS[entry.severity]}`}
                        >
                          {entry.severity}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${CATEGORY_COLORS[entry.category]}`}
                        >
                          {entry.category}
                        </span>
                        {entry.resolved_at && (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                            resolved
                          </span>
                        )}
                        {entry.component && (
                          <span className="text-xs text-zinc-500">
                            {entry.component}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                        className="mt-1 block w-full truncate text-left text-sm text-white hover:text-violet-300"
                        title={entry.message}
                      >
                        {entry.message}
                      </button>
                      {entry.url && (
                        <div className="mt-0.5 truncate text-xs text-zinc-500">
                          {entry.url}
                        </div>
                      )}
                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {entry.stack && (
                            <pre className="max-h-64 overflow-auto rounded bg-zinc-950 p-2 text-xs text-zinc-400">
                              {entry.stack}
                            </pre>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => void copySingle(entry)}
                              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-700"
                            >
                              Copy as Markdown
                            </button>
                            <button
                              onClick={() => void toggleResolved(entry)}
                              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-700"
                            >
                              {entry.resolved_at ? "Unresolve" : "Mark resolved"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="hidden w-20 text-right text-sm text-zinc-400 sm:block">
                      ×{entry.count}
                    </div>
                    <time className="hidden w-40 text-right text-xs text-zinc-500 sm:block">
                      {new Date(entry.updated_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportText && (
        <div className="rounded-md border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
            <h2 className="text-sm font-medium text-white">Markdown report</h2>
            <button
              onClick={() => setReportText(null)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Close
            </button>
          </div>
          <textarea
            readOnly
            value={reportText}
            className="block h-64 w-full resize-none bg-zinc-950 p-3 font-mono text-xs text-zinc-300"
          />
        </div>
      )}
    </div>
  );
}
