"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { authHeaders } from "@/lib/api-central/auth"
import { fmt } from "@/lib/api-central/formatting"

interface ProviderUsage {
  requests: number
  costUsd: number
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

interface Stats {
  activeServices: number
  totalServices: number
  totalBudget: number
  totalSpend: number
  overBudgetCount: number
  secretsCount: number
  servicesWithSecrets: number
  upcomingRenewals: { name: string; renewal_date: string }[]
  byEntity: Record<string, number>
  byCategory: Record<string, number>
}

export default function ApisOverviewPage() {
  const [fleetSites, setFleetSites] = useState<FleetSiteData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [fleetRes, statsRes] = await Promise.all([
          fetch("/api/fleet/status"),
          fetch("/api/api-central/stats", { headers: authHeaders() }),
        ])

        if (fleetRes.ok) {
          const json = await fleetRes.json()
          setFleetSites(json.sites || [])
        }
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch (err) {
        console.error("Failed to load overview data:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Aggregate fleet API usage
  let grandTotalRequests = 0
  let grandTotalCost = 0
  const aiProviders = new Map<string, ProviderUsage>()
  const allProviders = new Map<string, ProviderUsage>()

  for (const site of fleetSites) {
    if (!site.apiUsage) continue
    grandTotalRequests += site.apiUsage.totalRequests
    grandTotalCost += site.apiUsage.totalCostUsd
    for (const [provider, usage] of Object.entries(site.apiUsage.providers)) {
      const existing = allProviders.get(provider) ?? { requests: 0, costUsd: 0 }
      existing.requests += usage.requests
      existing.costUsd += usage.costUsd
      allProviders.set(provider, existing)

      // Track AI-specific providers
      const aiNames = ["anthropic", "openai", "google", "groq", "openrouter", "perplexity", "replicate"]
      if (aiNames.includes(provider.toLowerCase())) {
        const aiExisting = aiProviders.get(provider) ?? { requests: 0, costUsd: 0 }
        aiExisting.requests += usage.requests
        aiExisting.costUsd += usage.costUsd
        aiProviders.set(provider, aiExisting)
      }
    }
  }

  const totalAiCost = [...aiProviders.values()].reduce((s, v) => s + v.costUsd, 0)
  const sitesReporting = fleetSites.filter((s) => s.apiUsage).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Fleet Usage Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Total API Requests</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {grandTotalRequests.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            from {sitesReporting} site{sitesReporting !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Total API Cost</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {fmt(grandTotalCost)}
          </p>
          <p className="mt-1 text-xs text-zinc-600">current month</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">AI Traffic Cost</p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">
            {fmt(totalAiCost)}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {aiProviders.size} AI provider{aiProviders.size !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Registered Services</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {stats?.activeServices ?? 0}
            <span className="text-sm font-normal text-zinc-500">
              {" "}/ {stats?.totalServices ?? 0}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-600">active</p>
        </div>
      </div>

      {/* API Central Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Monthly Budget</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {fmt(stats.totalBudget)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Monthly Spend</p>
            <p className={`mt-1 text-2xl font-semibold ${stats.totalSpend > stats.totalBudget ? "text-red-400" : "text-white"}`}>
              {fmt(stats.totalSpend)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Stored Secrets</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {stats.secretsCount}
            </p>
          </div>
          <div className={`rounded-lg border p-5 ${stats.overBudgetCount > 0 ? "border-red-500/20 bg-red-500/5" : "border-zinc-800 bg-zinc-900"}`}>
            <p className="text-sm text-zinc-500">Over Budget</p>
            <p className={`mt-1 text-2xl font-semibold ${stats.overBudgetCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {stats.overBudgetCount}
            </p>
          </div>
        </div>
      )}

      {/* AI Provider Breakdown */}
      {aiProviders.size > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">AI Provider Spend</h2>
          <div className="space-y-3">
            {[...aiProviders.entries()]
              .sort(([, a], [, b]) => b.costUsd - a.costUsd)
              .map(([provider, usage]) => {
                const pctOfTotal = totalAiCost > 0 ? (usage.costUsd / totalAiCost) * 100 : 0
                return (
                  <div key={provider}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-zinc-300">{provider}</span>
                      <span className="text-zinc-400">
                        {fmt(usage.costUsd)} &middot; {usage.requests.toLocaleString()} calls
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${Math.max(pctOfTotal, 1)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Alerts & Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Upcoming Renewals */}
        {stats?.upcomingRenewals && stats.upcomingRenewals.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="text-sm font-medium text-amber-400">Upcoming Renewals</h3>
            <ul className="mt-2 space-y-1">
              {stats.upcomingRenewals.slice(0, 5).map((s) => (
                <li key={s.name} className="text-sm text-zinc-400">
                  {s.name} &mdash;{" "}
                  <span className="text-amber-400">
                    {new Date(s.renewal_date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-medium text-zinc-300">Quick Actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/apis/keys"
              className="rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20 transition-colors hover:bg-amber-500/20"
            >
              Add API Key
            </Link>
            <Link
              href="/apis/services"
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-700"
            >
              Manage Services
            </Link>
            <Link
              href="/apis/usage"
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-700"
            >
              View Usage
            </Link>
            <Link
              href="/apis/audit"
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-700"
            >
              Run Audit
            </Link>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {grandTotalRequests === 0 && !stats && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">No API data yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Enable the{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">
              apiUsage
            </code>{" "}
            module in your sites and add services in{" "}
            <Link href="/apis/services" className="text-amber-400 hover:text-amber-300">
              API Central
            </Link>{" "}
            to start tracking.
          </p>
        </div>
      )}
    </div>
  )
}
