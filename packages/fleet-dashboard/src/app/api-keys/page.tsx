"use client";

import { useState } from "react";
import { apiKeys, type ApiKeyEntry } from "@/fleet.config";

const providerColors: Record<string, string> = {
  anthropic: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  openai: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  google: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  supabase: "bg-green-500/10 text-green-400 ring-green-500/20",
  stripe: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  netlify: "bg-teal-500/10 text-teal-400 ring-teal-500/20",
  vercel: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

const envBadge: Record<string, string> = {
  production: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  staging: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  development: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
};

export default function ApiKeysPage() {
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  const providers = [...new Set(apiKeys.map((k) => k.provider))].sort();
  const projects = [...new Set(apiKeys.map((k) => k.projectName))].sort();

  const filtered = apiKeys.filter((k) => {
    if (filterProvider !== "all" && k.provider !== filterProvider) return false;
    if (filterProject !== "all" && k.projectName !== filterProject) return false;
    return true;
  });

  const activeCount = apiKeys.filter((k) => k.isActive).length;
  const totalBudget = apiKeys.reduce((sum, k) => sum + (k.monthlyBudgetUsd ?? 0), 0);

  if (apiKeys.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">API Keys</h1>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">No API keys registered</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Add your API keys to <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">src/fleet.config.ts</code> to
            start tracking keys across projects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {apiKeys.length} key{apiKeys.length !== 1 ? "s" : ""} registered &middot;{" "}
            {activeCount} active &middot; ${totalBudget.toLocaleString()}/mo budget
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
          >
            <option value="all">All providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Key Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Hint</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Project</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Env</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Budget</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((key, i) => (
              <tr key={i} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${providerColors[key.provider] ?? "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"}`}>
                    {key.provider}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-300">{key.keyName}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{key.keyHint}</td>
                <td className="px-4 py-3 text-zinc-400">{key.projectName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${envBadge[key.environment] ?? ""}`}>
                    {key.environment}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {key.monthlyBudgetUsd != null ? `$${key.monthlyBudgetUsd}/mo` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${key.isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${key.isActive ? "bg-emerald-500" : "bg-zinc-600"}`} />
                    {key.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500">No keys match the current filters.</p>
      )}
    </div>
  );
}
