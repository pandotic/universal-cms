"use client"

import { useEffect, useState } from "react"
import { providerColors } from "@/lib/api-central/formatting"

interface ProviderUsage {
  requests: number
  costUsd: number
}

interface SiteApiUsage {
  siteName: string
  siteUrl: string
  environment: string
  totalRequests: number
  totalCostUsd: number
  providers: Record<string, ProviderUsage>
}

interface FleetSiteData {
  name: string
  url: string
  environment: string
  status: string
  siteName?: string
  apiUsage?: {
    totalRequests: number
    totalCostUsd: number
    providers: Record<string, ProviderUsage>
  }
}

export default function ApisUsagePage() {
  const [sites, setSites] = useState<SiteApiUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/fleet/status")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: { sites: FleetSiteData[] } = await res.json()

        const siteUsage: SiteApiUsage[] = json.sites
          .filter((s) => s.apiUsage)
          .map((s) => ({
            siteName: s.siteName ?? s.name,
            siteUrl: s.url,
            environment: s.environment,
            totalRequests: s.apiUsage!.totalRequests,
            totalCostUsd: s.apiUsage!.totalCostUsd,
            providers: s.apiUsage!.providers,
          }))

        setSites(siteUsage)
      } catch (err) {
        console.error("Failed to fetch API usage:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsage()
  }, [])

  // Aggregate across all sites
  const allProviders = new Map<string, ProviderUsage>()
  let grandTotalRequests = 0
  let grandTotalCost = 0

  for (const site of sites) {
    grandTotalRequests += site.totalRequests
    grandTotalCost += site.totalCostUsd
    for (const [provider, usage] of Object.entries(site.providers)) {
      const existing = allProviders.get(provider) ?? { requests: 0, costUsd: 0 }
      existing.requests += usage.requests
      existing.costUsd += usage.costUsd
      allProviders.set(provider, existing)
    }
  }

  const sortedProviders = [...allProviders.entries()].sort(
    ([, a], [, b]) => b.costUsd - a.costUsd
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading API usage data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">
        Current month &middot; aggregated from {sites.length} site
        {sites.length !== 1 ? "s" : ""} reporting usage data
      </p>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Total Requests</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {grandTotalRequests.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Total Cost</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            ${grandTotalCost.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Providers</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {allProviders.size}
          </p>
        </div>
      </div>

      {/* Provider Breakdown */}
      {sortedProviders.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Cost by Provider
          </h2>
          <div className="space-y-3">
            {sortedProviders.map(([provider, usage]) => {
              const pct =
                grandTotalCost > 0
                  ? (usage.costUsd / grandTotalCost) * 100
                  : 0
              const barColor = providerColors[provider] ?? "bg-zinc-600"
              return (
                <div key={provider}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-zinc-300">
                      {provider}
                    </span>
                    <span className="text-zinc-400">
                      ${usage.costUsd.toFixed(2)} &middot;{" "}
                      {usage.requests.toLocaleString()} calls
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-Site Breakdown */}
      {sites.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Cost by Site</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-3 text-left font-medium text-zinc-400">
                  Site
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-400">
                  Requests
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-400">
                  Cost
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-400">
                  Top Provider
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sites
                .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
                .map((site) => {
                  const topProvider = Object.entries(site.providers).sort(
                    ([, a], [, b]) => b.costUsd - a.costUsd
                  )[0]
                  return (
                    <tr key={site.siteUrl} className="hover:bg-zinc-900/50">
                      <td className="px-6 py-3">
                        <div className="text-zinc-300">{site.siteName}</div>
                        <div className="text-xs text-zinc-600">
                          {site.environment}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-zinc-400">
                        {site.totalRequests.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-zinc-300">
                        ${site.totalCostUsd.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 capitalize text-zinc-400">
                        {topProvider
                          ? `${topProvider[0]} ($${topProvider[1].costUsd.toFixed(2)})`
                          : "\u2014"}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">
            No API usage data yet
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Enable the{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">
              apiUsage
            </code>{" "}
            module in your deployed sites to start tracking API costs.
          </p>
        </div>
      )}
    </div>
  )
}
