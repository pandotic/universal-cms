"use client";

import { useEffect, useState } from "react";

interface SiteStatus {
  name: string;
  url: string;
  environment: string;
  status: "up" | "down" | "unknown";
  version?: string;
  siteName?: string;
  enabledModules?: string[];
  disabledModules?: string[];
  moduleCount?: { enabled: number; disabled: number };
  error?: string;
  checkedAt: string;
}

interface FleetResponse {
  sites: SiteStatus[];
}

const statusConfig = {
  up: { label: "Up", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  down: { label: "Down", dot: "bg-red-500", badge: "bg-red-500/10 text-red-400 ring-red-500/20" },
  unknown: { label: "Unknown", dot: "bg-zinc-500", badge: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20" },
} as const;

const envBadge = {
  production: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  staging: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  development: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
} as const;

export default function FleetOverview() {
  const [data, setData] = useState<FleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/fleet/status");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: FleetResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch fleet status");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading fleet status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">Error loading fleet status</p>
        <p className="mt-1 text-sm text-red-400/70">{error}</p>
      </div>
    );
  }

  if (!data || data.sites.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
        <h2 className="text-lg font-medium text-zinc-300">No sites configured</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Add sites to <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">src/fleet.config.ts</code> to start monitoring your fleet.
        </p>
      </div>
    );
  }

  const upCount = data.sites.filter((s) => s.status === "up").length;
  const downCount = data.sites.filter((s) => s.status === "down").length;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data.sites.length} site{data.sites.length !== 1 ? "s" : ""} monitored
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">{upCount} up</span>
          </span>
          {downCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span className="text-zinc-400">{downCount} down</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.sites.map((site) => {
          const sc = statusConfig[site.status];
          const eb = envBadge[site.environment as keyof typeof envBadge] ?? envBadge.development;

          return (
            <div
              key={site.url}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-white">
                    {site.siteName ?? site.name}
                  </h3>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block truncate text-xs text-zinc-500 hover:text-zinc-400"
                  >
                    {site.url}
                  </a>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sc.badge}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${eb}`}>
                  {site.environment}
                </span>
                {site.version && (
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                    v{site.version}
                  </span>
                )}
                {site.moduleCount && (
                  <span className="text-xs text-zinc-500">
                    {site.moduleCount.enabled} module{site.moduleCount.enabled !== 1 ? "s" : ""} enabled
                  </span>
                )}
              </div>

              {site.error && (
                <p className="mt-3 truncate text-xs text-red-400/80" title={site.error}>
                  {site.error}
                </p>
              )}

              <p className="mt-3 text-xs text-zinc-600">
                Checked {new Date(site.checkedAt).toLocaleTimeString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
