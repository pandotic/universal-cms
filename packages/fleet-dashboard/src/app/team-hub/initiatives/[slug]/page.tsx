"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getInitiativeBySlug,
  updateInitiative,
  deleteInitiative,
} from "@pandotic/universal-cms/data/hub-initiatives";
import {
  INITIATIVE_KINDS,
  INITIATIVE_STAGES,
  type HubInitiative,
  type InitiativeKind,
  type InitiativeStage,
} from "@pandotic/universal-cms/types/initiatives";

interface TeamUser {
  id: string;
  name: string;
}

export default function InitiativeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [initiative, setInitiative] = useState<HubInitiative | null>(null);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [found, usersRes] = await Promise.all([
          getInitiativeBySlug(supabase, slug!),
          supabase.from("users").select("id, name").order("name"),
        ]);
        if (cancelled) return;
        setInitiative(found);
        setUsers((usersRes.data ?? []) as TeamUser[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, supabase]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-zinc-500">Loading…</div>;
  }
  if (!initiative) {
    return (
      <div className="space-y-4">
        <Link
          href="/initiatives"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={14} /> Initiatives
        </Link>
        <div className="rounded-lg border border-zinc-800 p-12 text-center text-sm text-zinc-500">
          Initiative not found.
        </div>
      </div>
    );
  }

  const handleChange = <K extends keyof HubInitiative>(
    key: K,
    value: HubInitiative[K],
  ) => {
    setInitiative({ ...initiative, [key]: value });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = await updateInitiative(supabase, initiative.id, {
        name: initiative.name,
        kind: initiative.kind,
        stage: initiative.stage,
        owner_id: initiative.owner_id,
        counterparty: initiative.counterparty,
        starts_on: initiative.starts_on,
        ends_on: initiative.ends_on,
        next_step: initiative.next_step,
        next_step_due: initiative.next_step_due,
        notes: initiative.notes,
      });
      setInitiative(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this initiative? This can't be undone.")) return;
    await deleteInitiative(supabase, initiative.id);
    router.push("/initiatives");
  };

  return (
    <div className="space-y-6">
      <Link
        href="/initiatives"
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={14} /> Initiatives
      </Link>

      <form
        onSubmit={handleSave}
        className="max-w-2xl space-y-4 rounded-lg border border-zinc-800 p-6"
      >
        {error && (
          <div className="rounded border border-red-800 bg-red-950 p-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Name</span>
          <input
            required
            value={initiative.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Kind</span>
            <select
              value={initiative.kind}
              onChange={(e) =>
                handleChange("kind", e.target.value as InitiativeKind)
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            >
              {INITIATIVE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Stage</span>
            <select
              value={initiative.stage}
              onChange={(e) =>
                handleChange("stage", e.target.value as InitiativeStage)
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            >
              {INITIATIVE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Owner</span>
            <select
              value={initiative.owner_id ?? ""}
              onChange={(e) => handleChange("owner_id", e.target.value || null)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            >
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Counterparty</span>
            <input
              value={initiative.counterparty ?? ""}
              onChange={(e) =>
                handleChange("counterparty", e.target.value || null)
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Starts on</span>
            <input
              type="date"
              value={initiative.starts_on ?? ""}
              onChange={(e) =>
                handleChange("starts_on", e.target.value || null)
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Ends on</span>
            <input
              type="date"
              value={initiative.ends_on ?? ""}
              onChange={(e) => handleChange("ends_on", e.target.value || null)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Next step</span>
          <input
            value={initiative.next_step ?? ""}
            onChange={(e) => handleChange("next_step", e.target.value || null)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Next step due</span>
          <input
            type="date"
            value={initiative.next_step_due ?? ""}
            onChange={(e) =>
              handleChange("next_step_due", e.target.value || null)
            }
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Notes</span>
          <textarea
            rows={4}
            value={initiative.notes ?? ""}
            onChange={(e) => handleChange("notes", e.target.value || null)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 disabled:opacity-50 hover:bg-zinc-200"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
