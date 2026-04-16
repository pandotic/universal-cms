"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminConfig } from "@/config/admin-config";
import type { SocialContentStats, SocialContentItem } from "@pandotic/universal-cms/types/social";

interface Property {
  id: string;
  name: string;
  slug: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400",
  review: "bg-amber-500/10 text-amber-400",
  approved: "bg-blue-500/10 text-blue-400",
  published: "bg-emerald-500/10 text-emerald-400",
  archived: "bg-zinc-700/10 text-zinc-500",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  linkedin: "bg-blue-500/10 text-blue-400",
  instagram: "bg-pink-500/10 text-pink-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  tiktok: "bg-zinc-500/10 text-zinc-300",
  youtube: "bg-red-500/10 text-red-400",
  other: "bg-zinc-500/10 text-zinc-400",
};

export default function SocialDashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [stats, setStats] = useState<SocialContentStats | null>(null);
  const [recentContent, setRecentContent] = useState<SocialContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((d) => {
        setProperties(d.data ?? []);
        if (d.data?.length > 0) {
          setSelectedProperty(d.data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/social/stats?propertyId=${selectedProperty}`).then((r) => r.json()),
      fetch(`/api/social/content?propertyId=${selectedProperty}&limit=10`).then((r) => r.json()),
    ])
      .then(([statsData, contentData]) => {
        setStats(statsData.data ?? null);
        setRecentContent(contentData.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProperty]);

  function getPropertyName(id: string) {
    return properties.find((p) => p.id === id)?.name ?? "Unknown";
  }

  if (!adminConfig.features.social) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">
          Social content management is not enabled in this configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Social
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Content management and brand voice across properties
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/social/content"
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:bg-zinc-800/50 transition-colors"
        >
          <h3 className="text-sm font-medium text-white">Manage Content</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Create, edit, and publish social content across platforms
          </p>
        </Link>
        <Link
          href="/social/brand-voice"
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:bg-zinc-800/50 transition-colors"
        >
          <h3 className="text-sm font-medium text-white">Brand Voice Briefs</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Define tone, audience, and messaging guidelines per property
          </p>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-4 text-sm text-zinc-500">Loading stats...</p>
        </div>
      ) : !stats ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-sm text-zinc-500">No social content data yet</p>
          <p className="mt-1 text-xs text-zinc-600">
            Select a property and start creating content
          </p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-5 gap-4">
            {(["draft", "review", "approved", "published", "archived"] as const).map(
              (status) => (
                <div
                  key={status}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                >
                  <p className="text-xs font-medium text-zinc-500 capitalize">
                    {status}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {stats.totalByStatus[status] ?? 0}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Platform breakdown */}
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              By Platform
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.totalByPlatform)
                .filter(([, count]) => count > 0)
                .map(([platform, count]) => (
                  <span
                    key={platform}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.other
                    }`}
                  >
                    {platform}: {count}
                  </span>
                ))}
              {Object.values(stats.totalByPlatform).every((c) => c === 0) && (
                <p className="text-xs text-zinc-600">No content yet</p>
              )}
            </div>
          </div>

          {/* Recent content */}
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              Recent Content
            </h2>
            {recentContent.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                <p className="text-sm text-zinc-500">No content items yet</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                        Content
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                        Platform
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {recentContent.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <p className="text-white truncate max-w-sm">
                            {item.title ?? item.body.slice(0, 80)}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              PLATFORM_COLORS[item.platform] ?? PLATFORM_COLORS.other
                            }`}
                          >
                            {item.platform}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[item.status] ?? STATUS_COLORS.draft
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400 text-xs">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
