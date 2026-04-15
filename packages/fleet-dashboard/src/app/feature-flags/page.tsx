"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[] | null;
  target_org_ids: string[] | null;
  target_user_ids: string[] | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const supabase = createClient();

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("feature_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setFlags(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function toggleFlag(flag: FeatureFlag) {
    const { error: err } = await supabase
      .from("feature_flags")
      .update({ is_enabled: !flag.is_enabled, updated_at: new Date().toISOString() })
      .eq("id", flag.id);

    if (err) {
      setError(`Failed to toggle flag: ${err.message}`);
      return;
    }
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f
      )
    );
  }

  async function updateRollout(flag: FeatureFlag, pct: number) {
    const { error: err } = await supabase
      .from("feature_flags")
      .update({ rollout_percentage: pct, updated_at: new Date().toISOString() })
      .eq("id", flag.id);

    if (err) {
      setError(`Failed to update rollout: ${err.message}`);
      return;
    }
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flag.id ? { ...f, rollout_percentage: pct } : f
      )
    );
  }

  async function deleteFlag(flag: FeatureFlag) {
    if (!confirm(`Delete flag "${flag.flag_name}"? This cannot be undone.`)) return;

    const { error: err } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", flag.id);

    if (err) {
      setError(`Failed to delete flag: ${err.message}`);
      return;
    }
    setFlags((prev) => prev.filter((f) => f.id !== flag.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Feature Flags
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage feature rollouts, targeting, and gradual deployments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          {showCreate ? "Cancel" : "New Flag"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateFlagForm
          supabase={supabase}
          onCreated={() => {
            setShowCreate(false);
            fetchFlags();
          }}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && flags.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No feature flags configured yet
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Create your first flag to start managing feature rollouts
          </p>
        </div>
      )}

      {/* Flags list */}
      {!loading && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleFlag(flag)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        flag.is_enabled ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          flag.is_enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {flag.flag_name}
                      </h3>
                      <code className="text-xs text-zinc-500">
                        {flag.flag_key}
                      </code>
                    </div>
                  </div>
                  {flag.description && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {flag.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span>Rollout:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={flag.rollout_percentage}
                        onChange={(e) =>
                          updateRollout(flag, parseInt(e.target.value, 10))
                        }
                        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-white"
                      />
                      <span className="w-8 text-right">
                        {flag.rollout_percentage}%
                      </span>
                    </div>
                    {flag.target_roles && flag.target_roles.length > 0 && (
                      <span>
                        Roles: {flag.target_roles.join(", ")}
                      </span>
                    )}
                    <span>
                      Created{" "}
                      {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteFlag(flag)}
                  className="shrink-0 rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                  title="Delete flag"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Flag Form ──────────────────────────────────────────────────────

function CreateFlagForm({
  supabase,
  onCreated,
}: {
  supabase: ReturnType<typeof createClient>;
  onCreated: () => void;
}) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim() || !name.trim()) return;

    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: err } = await supabase.from("feature_flags").insert({
      flag_key: key.trim().toLowerCase().replace(/\s+/g, "_"),
      flag_name: name.trim(),
      description: description.trim() || null,
      is_enabled: false,
      rollout_percentage: 0,
      created_by: user?.id ?? null,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }

    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4"
    >
      <h2 className="text-sm font-medium text-zinc-300">Create Feature Flag</h2>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Flag Key
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. enable_new_dashboard"
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New Dashboard"
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this flag control?"
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Flag"}
        </button>
      </div>
    </form>
  );
}
