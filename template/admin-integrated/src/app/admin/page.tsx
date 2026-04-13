"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/ssr";
import { PlatformAdminRoute, StatCard } from "@pandotic/admin-ui";
import { Users, Building2, Flag, Activity } from "lucide-react";
import Link from "next/link";
import { getEnabledFeatures } from "@/config/admin-config";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const enabledFeatures = getEnabledFeatures();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  return (
    <PlatformAdminRoute
      supabase={supabase}
      user={user}
      authLoading={loading}
      loginRoute="/login"
    >
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-zinc-400">
            Manage your application, users, and settings from here.
          </p>
        </div>

        {/* Metrics Cards */}
        {enabledFeatures.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Quick Stats</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {enabledFeatures.includes("users") && (
                <StatCard
                  title="Users"
                  value="0"
                  icon={Users}
                  color="text-blue-400"
                />
              )}
              {enabledFeatures.includes("organizations") && (
                <StatCard
                  title="Organizations"
                  value="0"
                  icon={Building2}
                  color="text-purple-400"
                />
              )}
              {enabledFeatures.includes("featureFlags") && (
                <StatCard
                  title="Feature Flags"
                  value="0"
                  icon={Flag}
                  color="text-orange-400"
                />
              )}
              {enabledFeatures.includes("auditLog") && (
                <StatCard
                  title="Recent Actions"
                  value="0"
                  icon={Activity}
                  color="text-green-400"
                />
              )}
            </div>
          </div>
        )}

        {/* Feature Overview */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Enabled Features</h2>
          {enabledFeatures.length > 0 ? (
            <div className="space-y-3">
              {enabledFeatures.includes("users") && (
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-4">
                  <span className="font-medium">User Management</span>
                  <Link
                    href="/admin/users"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Manage Users →
                  </Link>
                </div>
              )}
              {enabledFeatures.includes("organizations") && (
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-4">
                  <span className="font-medium">Organization Management</span>
                  <Link
                    href="/admin/organizations"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Manage Organizations →
                  </Link>
                </div>
              )}
              {enabledFeatures.includes("featureFlags") && (
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-4">
                  <span className="font-medium">Feature Flags</span>
                  <Link
                    href="/admin/feature-flags"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Manage Flags →
                  </Link>
                </div>
              )}
              {enabledFeatures.includes("auditLog") && (
                <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-4">
                  <span className="font-medium">Audit Logs</span>
                  <Link
                    href="/admin/audit-log"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View Logs →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-400">No features enabled. Check your config.</p>
          )}
        </div>

        {/* Configuration Info */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm text-amber-300">
            <strong>Tip:</strong> Edit{" "}
            <code className="rounded bg-amber-950 px-2 py-1">
              src/config/admin-config.ts
            </code>{" "}
            to enable/disable features. Tree-shaking will automatically exclude disabled
            features from your bundle.
          </p>
        </div>
      </div>
    </PlatformAdminRoute>
  );
}
