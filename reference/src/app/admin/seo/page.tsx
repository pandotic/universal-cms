"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  ImageOff,
  FileWarning,
  Code2,
  BrainCircuit,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentPageSEO {
  id: string;
  title: string;
  path: string;
  hasMetaDescription: boolean;
  hasOgImage: boolean;
  hasSchema: boolean;
  aeoScore: number; // 0-100
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreBadge(score: number) {
  if (score >= 80)
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        {score}
      </span>
    );
  if (score >= 50)
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        {score}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      {score}
    </span>
  );
}

function boolIcon(ok: boolean) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-green-600" />
  ) : (
    <AlertTriangle className="h-4 w-4 text-amber-500" />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SEODashboardPage() {
  const [pages, setPages] = useState<ContentPageSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "issues">("all");

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seo/dashboard");
      if (res.ok) {
        const json = await res.json();
        setPages(json.data);
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const missingDescriptions = pages.filter((p) => !p.hasMetaDescription).length;
  const missingOgImages = pages.filter((p) => !p.hasOgImage).length;
  const missingSchemas = pages.filter((p) => !p.hasSchema).length;
  const avgAeo =
    pages.length > 0
      ? Math.round(pages.reduce((s, p) => s + p.aeoScore, 0) / pages.length)
      : 0;

  const overallHealth = Math.round(
    (pages.filter(
      (p) => p.hasMetaDescription && p.hasOgImage && p.hasSchema && p.aeoScore >= 60
    ).length /
      Math.max(pages.length, 1)) *
      100
  );

  const displayed =
    filter === "issues"
      ? pages.filter(
          (p) =>
            !p.hasMetaDescription ||
            !p.hasOgImage ||
            !p.hasSchema ||
            p.aeoScore < 60
        )
      : pages;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor search-engine and answer-engine readiness across all published
          content.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          icon={<Search className="h-5 w-5 text-blue-600" />}
          label="Overall Health"
          value={`${overallHealth}%`}
          sub={`${pages.length} pages`}
        />
        <KPICard
          icon={<FileWarning className="h-5 w-5 text-amber-600" />}
          label="Missing Descriptions"
          value={String(missingDescriptions)}
          sub="pages"
          alert={missingDescriptions > 0}
        />
        <KPICard
          icon={<ImageOff className="h-5 w-5 text-amber-600" />}
          label="Missing OG Images"
          value={String(missingOgImages)}
          sub="pages"
          alert={missingOgImages > 0}
        />
        <KPICard
          icon={<Code2 className="h-5 w-5 text-purple-600" />}
          label="Schema Coverage"
          value={`${pages.length - missingSchemas}/${pages.length}`}
          sub="pages with schema"
        />
        <KPICard
          icon={<BrainCircuit className="h-5 w-5 text-teal-600" />}
          label="Avg AEO Score"
          value={String(avgAeo)}
          sub="out of 100"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            onClick={() => setFilter("issues")}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Fix missing descriptions ({missingDescriptions})
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            onClick={() => setFilter("issues")}
          >
            <Code2 className="h-3.5 w-3.5" />
            Add schemas ({missingSchemas})
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            onClick={() => setFilter("all")}
          >
            Show all pages
          </button>
        </div>
      </div>

      {/* Page checklist table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium text-center">
                  Meta Desc
                </th>
                <th className="px-4 py-3 font-medium text-center">OG Image</th>
                <th className="px-4 py-3 font-medium text-center">Schema</th>
                <th className="px-4 py-3 font-medium text-center">
                  AEO Score
                </th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((page) => (
                <tr
                  key={page.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{page.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {page.path}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {boolIcon(page.hasMetaDescription)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {boolIcon(page.hasOgImage)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {boolIcon(page.hasSchema)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {scoreBadge(page.aeoScore)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {pages.length === 0
                      ? "No published content pages found. Create and publish content to see SEO metrics."
                      : "No pages match the current filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KPICard({
  icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        alert ? "border-amber-300" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
