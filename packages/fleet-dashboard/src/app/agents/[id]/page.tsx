"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { HubAgent, HubAgentRun, AgentType } from "@pandotic/universal-cms/types/agent";

interface Property {
  id: string;
  name: string;
  slug: string;
}

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

const RUN_STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-500/10 text-zinc-400",
  running: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
  cancelled: "bg-amber-500/10 text-amber-400",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [agent, setAgent] = useState<HubAgent | null>(null);
  const [runs, setRuns] = useState<HubAgentRun[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editConfig, setEditConfig] = useState("{}");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [agentRes, runsRes, propsRes] = await Promise.all([
        fetch(`/api/agents/${id}`),
        fetch(`/api/agents/${id}/runs?limit=20`),
        fetch("/api/properties"),
      ]);

      const agentData = await agentRes.json();
      const runsData = await runsRes.json();
      const propsData = await propsRes.json();

      if (agentData.data) {
        setAgent(agentData.data);
        setEditName(agentData.data.name);
        setEditDescription(agentData.data.description ?? "");
        setEditSchedule(agentData.data.schedule ?? "");
        setEditConfig(JSON.stringify(agentData.data.config ?? {}, null, 2));
      }
      setRuns(runsData.data ?? []);
      setProperties(propsData.data ?? []);
    } catch {
      showToast("Failed to load agent");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function getPropertyName(propertyId: string) {
    return properties.find((p) => p.id === propertyId)?.name ?? "Unknown";
  }

  async function handleTrigger() {
    setTriggerLoading(true);
    try {
      const res = await fetch(`/api/agents/${id}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        showToast("Agent run triggered");
        const runsRes = await fetch(`/api/agents/${id}/runs?limit=20`);
        const runsData = await runsRes.json();
        setRuns(runsData.data ?? []);
      } else {
        showToast("Failed to trigger run");
      }
    } catch {
      showToast("Failed to trigger run");
    } finally {
      setTriggerLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let config = {};
      try {
        config = JSON.parse(editConfig);
      } catch {
        showToast("Invalid JSON config");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          schedule: editSchedule || null,
          config,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgent(data.data);
        setShowEdit(false);
        showToast("Agent updated");
      } else {
        showToast("Failed to update agent");
      }
    } catch {
      showToast("Failed to update agent");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this agent? This cannot be undone.")) return;

    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/agents";
    } else {
      showToast("Failed to delete agent");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">Agent not found</p>
        <Link href="/agents" className="mt-2 inline-block text-sm text-zinc-400 hover:text-white">
          &larr; Back to agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/agents"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            &larr; Back to agents
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {agent.name}
          </h1>
          {agent.description && (
            <p className="mt-1 text-sm text-zinc-500">{agent.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTrigger}
            disabled={triggerLoading}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {triggerLoading ? "Triggering..." : "Run Now"}
          </button>
          <button
            onClick={() => setShowEdit(!showEdit)}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            {showEdit ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-800 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-500">Type</p>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              AGENT_TYPE_COLORS[agent.agent_type] ?? AGENT_TYPE_COLORS.custom
            }`}
          >
            {AGENT_TYPE_LABELS[agent.agent_type] ?? agent.agent_type}
          </span>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-500">Schedule</p>
          <p className="mt-1 text-sm font-mono text-white">
            {agent.schedule ?? "Manual only"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-500">Property</p>
          <p className="mt-1 text-sm text-white">
            {getPropertyName(agent.property_id)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-500">Status</p>
          <p className="mt-1 text-sm">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                agent.enabled
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-zinc-500/10 text-zinc-400"
              }`}
            >
              {agent.enabled ? "Enabled" : "Disabled"}
            </span>
          </p>
        </div>
      </div>

      {/* Edit form */}
      {showEdit && (
        <form
          onSubmit={handleSave}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Schedule (cron)
              </label>
              <input
                type="text"
                value={editSchedule}
                onChange={(e) => setEditSchedule(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="0 0 * * 0 (optional)"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Config (JSON)
            </label>
            <textarea
              value={editConfig}
              onChange={(e) => setEditConfig(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-white/25"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Config display */}
      {!showEdit && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Configuration
          </h2>
          <pre className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300 font-mono overflow-auto">
            {JSON.stringify(agent.config ?? {}, null, 2)}
          </pre>
        </div>
      )}

      {/* Run history */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-2">
          Run History
        </h2>
        {runs.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-sm text-zinc-500">No runs yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Click &ldquo;Run Now&rdquo; to trigger a manual run
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                    Triggered By
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                    Started
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                    Completed
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {runs.map((run) => (
                  <>
                    <tr
                      key={run.id}
                      className="hover:bg-zinc-900/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedRun(
                          expandedRun === run.id ? null : run.id
                        )
                      }
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            RUN_STATUS_COLORS[run.status] ?? RUN_STATUS_COLORS.pending
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 capitalize">
                        {run.triggered_by}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 text-xs">
                        {formatDate(run.started_at)}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 text-xs">
                        {formatDate(run.completed_at)}
                      </td>
                      <td className="px-4 py-2.5 text-red-400 text-xs truncate max-w-xs">
                        {run.error_message ?? "—"}
                      </td>
                    </tr>
                    {expandedRun === run.id && (
                      <tr key={`${run.id}-detail`}>
                        <td colSpan={5} className="px-4 py-3 bg-zinc-900/50">
                          <p className="text-xs font-medium text-zinc-400 mb-1">
                            Result
                          </p>
                          <pre className="rounded bg-zinc-950 p-3 text-xs text-zinc-300 font-mono overflow-auto max-h-48">
                            {run.result
                              ? JSON.stringify(run.result, null, 2)
                              : "No result data"}
                          </pre>
                          {run.error_message && (
                            <>
                              <p className="text-xs font-medium text-zinc-400 mt-3 mb-1">
                                Error Message
                              </p>
                              <p className="text-xs text-red-400">
                                {run.error_message}
                              </p>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
