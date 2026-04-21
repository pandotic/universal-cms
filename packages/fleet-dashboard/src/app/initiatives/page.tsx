"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  listInitiatives,
  createInitiative,
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
  short_name: string;
  color: string;
}

const KIND_LABELS: Record<InitiativeKind, string> = {
  conference: "Conference",
  partnership: "Partnership",
  deal: "Deal",
  bet: "Bet",
  other: "Other",
};

const STAGE_LABELS: Record<InitiativeStage, string> = {
  idea: "Idea",
  active: "Active",
  stalled: "Stalled",
  won: "Won",
  lost: "Lost",
  complete: "Complete",
  archived: "Archived",
};

const STAGE_COLORS: Record<InitiativeStage, string> = {
  idea: "bg-zinc-500/10 text-zinc-400",
  active: "bg-emerald-500/10 text-emerald-400",
  stalled: "bg-amber-500/10 text-amber-400",
  won: "bg-emerald-500/10 text-emerald-400",
  lost: "bg-red-500/10 text-red-400",
  complete: "bg-blue-500/10 text-blue-400",
  archived: "bg-zinc-500/10 text-zinc-500",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function InitiativesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [initiatives, setInitiatives] = useState<HubInitiative[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<InitiativeStage | "">("");
  const [kindFilter, setKindFilter] = useState<InitiativeKind | "">("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<InitiativeKind>("deal");
  const [newOwnerId, setNewOwnerId] = useState<string>("");
  const [newCounterparty, setNewCounterparty] = useState("");
  const [newNextStep, setNewNextStep] = useState("");
  const [newNextStepDue, setNewNextStepDue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [inits, usersRes] = await Promise.all([
          listInitiatives(supabase),
          supabase.from("users").select("id, name, short_name, color").order("name"),
        ]);
        if (cancelled) return;
        setInitiatives(inits);
        setUsers((usersRes.data ?? []) as TeamUser[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    return initiatives.filter((i) => {
      if (stageFilter && i.stage !== stageFilter) return false;
      if (kindFilter && i.kind !== kindFilter) return false;
      return true;
    });
  }, [initiatives, stageFilter, kindFilter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createInitiative(supabase, {
        name: newName.trim(),
        slug: slugify(newName),
        kind: newKind,
        stage: "active",
        owner_id: newOwnerId || null,
        counterparty: newCounterparty.trim() || null,
        starts_on: null,
        ends_on: null,
        next_step: newNextStep.trim() || null,
        next_step_due: newNextStepDue || null,
        property_id: null,
        notes: null,
      });
      setInitiatives([created, ...initiatives]);
      setNewName("");
      setNewKind("deal");
      setNewOwnerId("");
      setNewCounterparty("");
      setNewNextStep("");
      setNewNextStepDue("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Initiatives
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Non-app things the team tracks: conferences, partnerships, client
            deals, and cross-cutting bets. Active ones auto-surface on the Team
            Hub weekly agenda.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "New initiative"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
        >
          {error && (
            <div className="rounded border border-red-800 bg-red-950 p-2 text-xs text-red-300">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-400">Name</span>
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                placeholder="e.g. ASU GSV 2026"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-400">Kind</span>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as InitiativeKind)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
              >
                {INITIATIVE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-400">Owner</span>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
              >
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-400">Counterparty</span>
              <input
                value={newCounterparty}
                onChange={(e) => setNewCounterparty(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                placeholder="e.g. Gaia, SCE, ASU GSV"
              />
            </label>
            <label className="text-sm col-span-2">
              <span className="mb-1 block text-zinc-400">Next step</span>
              <input
                value={newNextStep}
                onChange={(e) => setNewNextStep(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                placeholder="One line: what's next?"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-400">Next step due</span>
              <input
                type="date"
                value={newNextStepDue}
                onChange={(e) => setNewNextStepDue(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 disabled:opacity-50 hover:bg-zinc-200"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as InitiativeStage | "")}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
        >
          <option value="">All stages</option>
          {INITIATIVE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as InitiativeKind | "")}
          className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
        >
          <option value="">All kinds</option>
          {INITIATIVE_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 p-12 text-center text-sm text-zinc-500">
          No initiatives yet. Create one above.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {filtered.map((i) => {
            const owner = users.find((u) => u.id === i.owner_id);
            return (
              <Link
                key={i.id}
                href={`/initiatives/${i.slug}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-900/50"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-current/20 ${STAGE_COLORS[i.stage]}`}
                >
                  {STAGE_LABELS[i.stage]}
                </span>
                <span className="shrink-0 text-xs uppercase tracking-wider text-zinc-500">
                  {KIND_LABELS[i.kind]}
                </span>
                <span className="flex-1 text-sm font-medium text-white">
                  {i.name}
                </span>
                {i.counterparty && (
                  <span className="text-xs text-zinc-500">
                    {i.counterparty}
                  </span>
                )}
                {owner && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ background: owner.color }}
                    title={owner.name}
                  >
                    {owner.short_name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
