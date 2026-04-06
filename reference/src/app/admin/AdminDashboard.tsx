"use client";

import { useState } from "react";

interface RatingLog {
  id: string;
  platform_id: string;
  platform_slug: string;
  platform_name: string;
  source_name: string;
  average_score: number | null;
  review_count: number | null;
  snapshot_date: string;
  quarter_label: string;
  created_at: string;
}

interface AdminDashboardProps {
  lastRun: string | null;
  totalEntities: number;
  totalSources: number;
  recentLogs: RatingLog[];
}

const SOURCE_LABELS: Record<string, string> = {
  capterra: "Capterra",
  g2: "G2",
  getapp: "GetApp",
  "software-advice": "Software Advice",
  trustpilot: "Trustpilot",
  "apple-app-store": "App Store",
  "google-play-store": "Google Play",
  "gartner-peer-insights": "Gartner",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminDashboard({
  lastRun,
  totalEntities,
  totalSources,
  recentLogs,
}: AdminDashboardProps) {
  const [fetchStatus, setFetchStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [fetchLog, setFetchLog] = useState<string>("");
  const [exportStatus, setExportStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [exportLog, setExportLog] = useState<string>("");

  async function handleFetchRatings() {
    setFetchStatus("running");
    setFetchLog("Starting fetch...\n");
    try {
      const res = await fetch("/api/admin/fetch-ratings", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setFetchStatus("error");
        setFetchLog(data.error || "Failed to fetch ratings");
        return;
      }
      setFetchStatus("done");
      setFetchLog(
        `Completed: ${data.succeeded} succeeded, ${data.skipped} skipped, ${data.failed} failed\n` +
          (data.details || []).join("\n")
      );
    } catch (err) {
      setFetchStatus("error");
      setFetchLog(String(err));
    }
  }

  async function handleExportRatings() {
    setExportStatus("running");
    setExportLog("Exporting...\n");
    try {
      const res = await fetch("/api/admin/export-ratings", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setExportStatus("error");
        setExportLog(data.error || "Failed to export ratings");
        return;
      }
      setExportStatus("done");
      setExportLog(`Exported ${data.entityCount} entities to ratings.json`);
    } catch (err) {
      setExportStatus("error");
      setExportLog(String(err));
    }
  }

  // Group logs by snapshot date for summary
  const dateGroups = new Map<string, RatingLog[]>();
  for (const log of recentLogs) {
    const date = log.snapshot_date;
    if (!dateGroups.has(date)) dateGroups.set(date, []);
    dateGroups.get(date)!.push(log);
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <dt className="text-sm text-gray-500">Last Fetch</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {lastRun ? formatDate(lastRun) : "Never"}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <dt className="text-sm text-gray-500">Entities with Ratings</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {totalEntities}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <dt className="text-sm text-gray-500">Total Source Records</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">
            {totalSources}
          </dd>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Actions</h2>
        <p className="mt-1 text-xs text-gray-500">
          Step 1: Fetch pulls new ratings from review sources into Supabase.
          Step 2: Export writes the data to ratings.json for the site to display.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleFetchRatings}
            disabled={fetchStatus === "running"}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {fetchStatus === "running" ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Fetching...
              </>
            ) : (
              "Fetch Ratings"
            )}
          </button>
          <button
            onClick={handleExportRatings}
            disabled={exportStatus === "running"}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportStatus === "running" ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              "Export to JSON"
            )}
          </button>
        </div>

        {/* Fetch output */}
        {fetchLog && (
          <div
            className={`mt-4 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap ${
              fetchStatus === "error"
                ? "bg-red-50 text-red-700"
                : fetchStatus === "done"
                  ? "bg-green-50 text-green-800"
                  : "bg-gray-50 text-gray-700"
            }`}
          >
            {fetchLog}
          </div>
        )}

        {/* Export output */}
        {exportLog && (
          <div
            className={`mt-4 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap ${
              exportStatus === "error"
                ? "bg-red-50 text-red-700"
                : exportStatus === "done"
                  ? "bg-green-50 text-green-800"
                  : "bg-gray-50 text-gray-700"
            }`}
          >
            {exportLog}
          </div>
        )}
      </div>

      {/* Recent History */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Rating Snapshots
          </h2>
        </div>
        {recentLogs.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">
            No rating data found. Run a fetch to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">
                    Entity
                  </th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">
                    Source
                  </th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">
                    Score
                  </th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">
                    Reviews
                  </th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">
                    Quarter
                  </th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">
                    Fetched
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {log.platform_name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {SOURCE_LABELS[log.source_name] || log.source_name}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.average_score !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="h-3.5 w-3.5 text-amber-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {log.average_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {log.review_count?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {log.quarter_label}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
