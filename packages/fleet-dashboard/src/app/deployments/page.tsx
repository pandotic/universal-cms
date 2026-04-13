"use client";

import { useEffect, useState } from "react";
import { Package, GitBranch, Calendar, CheckCircle } from "lucide-react";
import { adminConfig } from "@/config/admin-config";

interface ProjectDeployment {
  id: string;
  projectName: string;
  version: string;
  enabledFeatures: string[];
  lastDeployedAt: string;
  status: "deployed" | "in-progress" | "failed";
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<ProjectDeployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeployments = async () => {
      try {
        // In production, fetch from API: GET /api/deployments
        // For now, use placeholder data
        setDeployments([
          {
            id: "proj-1",
            projectName: "Example Site 1",
            version: "1.0.0",
            enabledFeatures: ["users", "organizations", "feature-flags"],
            lastDeployedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: "deployed",
          },
          {
            id: "proj-2",
            projectName: "Example Site 2",
            version: "1.2.0",
            enabledFeatures: ["users", "organizations", "audit-log", "analytics"],
            lastDeployedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: "deployed",
          },
          {
            id: "proj-3",
            projectName: "Template App",
            version: "0.5.0",
            enabledFeatures: ["users", "organizations"],
            lastDeployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "deployed",
          },
        ]);
      } catch (err) {
        console.error("Failed to load deployments:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDeployments();
  }, []);

  if (!adminConfig.features.deployments) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">Deployment tracking is not enabled in this configuration.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading deployments...</p>
      </div>
    );
  }

  const statusConfig = {
    deployed: { label: "Deployed", badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
    "in-progress": { label: "In Progress", badge: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
    failed: { label: "Failed", badge: "bg-red-500/10 text-red-400 ring-red-500/20" },
  } as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Deployments</h1>
        <p className="mt-1 text-sm text-zinc-500">Track admin-ui deployments across consuming projects</p>
      </div>

      <div className="space-y-4">
        {deployments.length > 0 ? (
          deployments.map((deployment) => {
            const sc = statusConfig[deployment.status];
            return (
              <div
                key={deployment.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-zinc-400" />
                      <h3 className="text-lg font-semibold text-white">{deployment.projectName}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <GitBranch className="h-4 w-4" />
                        <span>v{deployment.version}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(deployment.lastDeployedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-zinc-400">Enabled Features</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {deployment.enabledFeatures.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
            <h2 className="text-lg font-medium text-zinc-300">No deployments tracked yet</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Consuming projects will report their deployments here as they integrate admin-ui.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">About Deployments</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          This page shows all projects across the Pandotic ecosystem that have integrated the admin-ui package.
          Each project reports which admin features it has enabled and when it last deployed a version.
          Use this to track adoption and coordinate feature releases.
        </p>
      </div>
    </div>
  );
}
