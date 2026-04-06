"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cmsConfig, type CmsModuleName } from "@/lib/cms";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/shadcn/card";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  FileText,
  Image,
  Users,
  Activity,
  Plus,
  Upload,
  History,
  Settings,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const MODULE_LABELS: Record<CmsModuleName, string> = {
  // Content & Pages
  contentPages: "Content Pages",
  landingPages: "Landing Pages",
  mediaLibrary: "Media Library",
  listicles: "Listicles",
  brandGuide: "Brand Guide",
  // Directory & Taxonomy
  directory: "Directory",
  categories: "Categories",
  frameworks: "Frameworks",
  glossary: "Glossary",
  certifications: "Certifications",
  // Career & Education
  careerHub: "Career Hub",
  // Engagement & Monetization
  reviews: "Reviews",
  affiliates: "Affiliates",
  clickAnalytics: "Click Analytics",
  merchants: "Merchants",
  ratings: "Ratings",
  // SEO & Technical
  seo: "SEO Tools",
  redirects: "Redirects",
  linkChecker: "Link Checker",
  internalLinks: "Internal Links",
  imagesSeo: "Image SEO",
  // Tools & Public Features
  compareTools: "Compare Tools",
  assessmentTool: "Assessment Tool",
  resourcesPage: "Resources Page",
  smallBusinessPage: "Small Business Page",
  // Forms & Lead Capture
  forms: "Forms",
  ctaManager: "CTA Manager",
  // System
  errorLog: "Error Log",
  activityLog: "Activity Log",
  bulkImport: "Bulk Import",
};

interface DashboardStats {
  contentPages: number;
  mediaFiles: number;
  activeUsers: number;
  recentActivity: {
    id: string;
    action: string;
    entity_type: string;
    entity_title: string | null;
    created_at: string;
  }[];
  recentActivityCount: number;
}

const quickActions = [
  {
    label: "Create Content Page",
    href: "/admin/content-pages/new",
    icon: Plus,
    description: "Add a new content page",
  },
  {
    label: "Upload Media",
    href: "/admin/media",
    icon: Upload,
    description: "Upload images and files",
  },
  {
    label: "View Activity Log",
    href: "/admin/activity",
    icon: History,
    description: "Review recent changes",
  },
  {
    label: "Manage Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Configure site settings",
  },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((json) => setStats(json.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Content Pages",
      value: stats ? stats.contentPages.toString() : "--",
      icon: FileText,
      description: "Total published pages",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Media Files",
      value: stats ? stats.mediaFiles.toString() : "--",
      icon: Image,
      description: "Uploaded assets",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Active Users",
      value: stats ? stats.activeUsers.toString() : "--",
      icon: Users,
      description: "Admin users",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Recent Activity",
      value: stats ? stats.recentActivityCount.toString() : "--",
      icon: Activity,
      description: "Recent events",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the {cmsConfig.siteName} admin panel.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {loading ? (
                        <span className="inline-block h-7 w-8 animate-pulse rounded bg-gray-200" />
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {stat.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 transition-colors group-hover:bg-gray-200">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {action.label}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest changes across the CMS</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.action.charAt(0).toUpperCase() + item.action.slice(1)}{" "}
                        {item.entity_type.replace(/_/g, " ")}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {item.entity_title || "Untitled"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">
                No recent activity yet. Changes will appear here as you use the CMS.
              </p>
            )}
            <div className="mt-3 border-t border-gray-100 pt-3">
              <Link
                href="/admin/activity"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                View all activity &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Module status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Module Status</CardTitle>
            <CardDescription>
              CMS modules configured in cms.config.ts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(
                Object.entries(cmsConfig.modules) as [CmsModuleName, boolean][]
              ).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    {enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                    <span
                      className={`text-sm ${enabled ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {MODULE_LABELS[key]}
                    </span>
                  </div>
                  <Badge variant={enabled ? "success" : "secondary"}>
                    {enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
