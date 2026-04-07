"use client";

import { useEffect, useState } from "react";

interface SiteStatus {
  name: string;
  url: string;
  environment: string;
  status: "up" | "down" | "unknown";
  siteName?: string;
  enabledModules?: string[];
  disabledModules?: string[];
}

interface FleetResponse {
  sites: SiteStatus[];
}

export default function ModuleMatrix() {
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
        <p className="mt-4 text-sm text-zinc-500">Loading module data...</p>
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
          Add sites to <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">src/fleet.config.ts</code> to see the module matrix.
        </p>
      </div>
    );
  }

  const reachableSites = data.sites.filter((s) => s.status === "up");

  // Collect all unique module names across all reachable sites
  const allModules = new Set<string>();
  for (const site of reachableSites) {
    site.enabledModules?.forEach((m) => allModules.add(m));
    site.disabledModules?.forEach((m) => allModules.add(m));
  }

  const sortedModules = Array.from(allModules).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  if (sortedModules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Module Matrix</h1>
          <p className="mt-1 text-sm text-zinc-500">No module data available from reachable sites.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Module Matrix</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {sortedModules.length} module{sortedModules.length !== 1 ? "s" : ""} across {reachableSites.length} reachable site{reachableSites.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="sticky left-0 z-10 bg-zinc-900 px-4 py-3 text-left font-medium text-zinc-400">
                Module
              </th>
              {reachableSites.map((site) => (
                <th
                  key={site.url}
                  className="px-4 py-3 text-center font-medium text-zinc-400 whitespace-nowrap"
                >
                  {site.siteName ?? site.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {sortedModules.map((mod) => {
              const enabledCount = reachableSites.filter(
                (s) => s.enabledModules?.includes(mod)
              ).length;

              return (
                <tr
                  key={mod}
                  className="transition-colors hover:bg-zinc-800/30"
                >
                  <td className="sticky left-0 z-10 bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {mod}
                      <span className="text-zinc-600">
                        {enabledCount}/{reachableSites.length}
                      </span>
                    </div>
                  </td>
                  {reachableSites.map((site) => {
                    const isEnabled = site.enabledModules?.includes(mod);
                    const isDisabled = site.disabledModules?.includes(mod);

                    return (
                      <td key={site.url} className="px-4 py-2.5 text-center">
                        {isEnabled ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </span>
                        ) : isDisabled ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-600">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </span>
                        ) : (
                          <span className="text-zinc-700">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
