"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { HubAgent, AgentType } from "@pandotic/universal-cms/types/agent";

const AGENT_TYPES: AgentType[] = [
  "seo_audit",
  "broken_links",
  "dependency_update",
  "content_freshness",
  "ssl_monitor",
  "custom",
];

const AGENT_TYPE_LABELS: Partial<Record<AgentType, string>> = {
  seo_audit: "SEO Audit",
  broken_links: "Broken Links",
  dependency_update: "Dependency Update",
  content_freshness: "Content Freshness",
  ssl_monitor: "SSL Monitor",
  custom: "Custom",
};

const AGENT_TYPE_COLORS: Partial<Record<AgentType, string>> = {
  seo_audit: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  broken_links: "bg-red-500/10 text-red-400 ring-red-500/20",
  dependency_update: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  content_freshness: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  ssl_monitor: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  custom: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

interface Property {
  id: string;
  name: string;
  slug: string;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PropertyAgentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [property, setProperty] = useState<Property | null>(null);
  const [agents, setAgents] = useState<HubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<AgentType>("seo_audit");
  const [formSchedule, setFormSchedule] = useState("");
  const [formConfig, setFormConfig] = useState("{}");

  useEffect(() => {
    loadProperty();
  }, [slug]);

  useEffect(() => {
    if (property) loadAgents();
  }, [property, typeFilter]);

  async function loadProperty() {
    const res = await fetch("/api/properties");
    const data = await res.json();
    const found = (data.data ?? []).find((p: Property) => p.slug === slug);
    setProperty(found ?? null);
    if (!found) setLoading(false);
  }

  async function loadAgents() {
    if (!property) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ propertyId: property.id });
      if (typeFilter) params.set("agentType", typeFilter);
      const res = await fetch(`/api/agents?${params}`);
      const data = await res.json();
      setAgents(data.data ?? []);
    } catch {
      showToast("Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function toggleEnabled(agent: HubAgent) {
    const prev = agents;
    setAgents((a) =>
      a.map((x) => (x.id === agent.id ? { ...x, enabled: !x.enabled } : x))
    );
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !agent.enabled }),
    });
    if (!res.ok) {
      setAgents(prev);
      showToast("Failed to update agent");
    } else {
      showToast(`Agent ${!agent.enabled ? "enabled" : "disabled"}`);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    setCreating(true);
    try {
      let config = {};
      try {
        config = JSON.parse(formConfig);
      } catch {
        showToast("Invalid JSON config");
        setCreating(false);
        return;
      }
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: slugify(formName),
          description: formDescription || null,
          agent_type: formType,
          property_id: property.id,
          schedule: formSchedule || null,
          config,
        }),
      });
      if (res.ok) {
        showToast("Agent created");
        setShowCreate(false);
        setFormName("");
        setFormDescription("");
        setFormType("seo_audit");
        setFormSchedule("");
        setFormConfig("{}");
        loadAgents();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to create agent");
      }
    } catch {
      showToast("Failed to create agent");
    } finally {
      setCreating(false);
    }
  }

  if (!loading && !property) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">Property not found</p>
        <Link href="/properties" className="mt-2 inline-block text-sm text-zinc-400 hover:text-white">
          &larr; Back to properties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/properties/${slug}`}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            &larr; Back to {property?.name ?? slug}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Agents for {property?.name ?? "..."}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Automated workflows scoped to this property
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          {showCreate ? "Cancel" : "Create Agent"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="SEO Audit — Weekly"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Agent Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as AgentType)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              >
                {AGENT_TYPES.map((t) => (
                  <option key={t} value={t}>{AGENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Schedule (cron)</label>
              <input
                type="text"
                value={formSchedule}
                onChange={(e) => setFormSchedule(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="0 0 * * 0 (optional)"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Config (JSON)</label>
            <textarea
              value={formConfig}
              onChange={(e) => setFormConfig(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-white/25"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Agent"}
          </button>
        </form>
      )}

      <div className="flex gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
        >
          <option value="">All Types</option>
          {AGENT_TYPES.map((t) => (
            <option key={t} value={t}>{AGENT_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-4 text-sm text-zinc-500">Loading agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-sm text-zinc-500">No agents for this property</p>
          <p className="mt-1 text-xs text-zinc-600">Create an agent to automate tasks</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Type</th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Schedule</th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/agents/${agent.id}`} className="font-medium text-white hover:underline">
                      {agent.name}
                    </Link>
                    {agent.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{agent.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${AGENT_TYPE_COLORS[agent.agent_type] ?? AGENT_TYPE_COLORS.custom}`}>
                      {AGENT_TYPE_LABELS[agent.agent_type] ?? agent.agent_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">
                    {agent.schedule ?? "Manual"}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleEnabled(agent)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${agent.enabled ? "bg-emerald-600" : "bg-zinc-700"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${agent.enabled ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
