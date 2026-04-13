"use client";

import { useEffect, useState } from "react";
import { Users, Building2, Globe, Activity, Zap, BarChart3 } from "lucide-react";
import { adminConfig } from "@/config/admin-config";

interface FleetMetrics {
  totalUsers: number;
  totalOrganizations: number;
  totalProperties: number;
  activeAdmins: number;
  deploymentCount: number;
  featureFlagsEnabled: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // In production, fetch from API: GET /api/analytics/metrics
        // For now, use placeholder data
        setMetrics({
          totalUsers: 142,
          totalOrganizations: 18,
          totalProperties: 247,
          activeAdmins: 12,
          deploymentCount: 89,
          featureFlagsEnabled: 24,
        });
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (!adminConfig.features.analytics) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">Fleet analytics is not enabled in this configuration.</p>
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading metrics...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: metrics.totalUsers,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Organizations",
      value: metrics.totalOrganizations,
      icon: Building2,
      color: "text-purple-400",
    },
    {
      label: "Properties",
      value: metrics.totalProperties,
      icon: Globe,
      color: "text-emerald-400",
    },
    {
      label: "Active Admins",
      value: metrics.activeAdmins,
      icon: Activity,
      color: "text-orange-400",
    },
    {
      label: "Deployments",
      value: metrics.deploymentCount,
      icon: Zap,
      color: "text-yellow-400",
    },
    {
      label: "Feature Flags",
      value: metrics.featureFlagsEnabled,
      icon: BarChart3,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Platform-wide metrics and adoption overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {card.value}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Usage Trends</h2>
        <p className="text-sm text-zinc-400">
          Charts and detailed usage trends coming soon. Connect your metrics API to see real-time data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Top Organizations</h2>
          <p className="text-sm text-zinc-400">
            Organization ranking by user count and activity level will display here.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Feature Adoption</h2>
          <p className="text-sm text-zinc-400">
            Feature usage breakdown by organization and user segment coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
