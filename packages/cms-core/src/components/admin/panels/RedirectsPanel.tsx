"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Redirect,
  createRedirect,
  deleteRedirect,
  getRedirects,
  updateRedirect,
} from "../../../data/redirects.js";
import {
  Field,
  GhostButton,
  PanelEmpty,
  PanelError,
  PanelHeading,
  PanelSpinner,
  PrimaryButton,
  StatusBadge,
  inputClass,
} from "./_shared.js";

export interface RedirectsPanelProps {
  supabase: SupabaseClient;
}

const TYPES: Array<301 | 302 | 307> = [301, 302, 307];

export function RedirectsPanel({ supabase }: RedirectsPanelProps) {
  const [rows, setRows] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getRedirects(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load redirects");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleToggle(r: Redirect) {
    try {
      await updateRedirect(supabase, r.id, { is_active: !r.is_active });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(r: Redirect) {
    if (!confirm(`Delete redirect from ${r.from_path}?`)) return;
    try {
      await deleteRedirect(supabase, r.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <PanelHeading
        title="Redirects"
        description={`${rows.length} total redirects. Toggle active to enable/disable without deleting.`}
        actions={
          <PrimaryButton type="button" onClick={() => setCreating((v) => !v)}>
            {creating ? "Cancel" : "New redirect"}
          </PrimaryButton>
        }
      />

      <PanelError message={error} />

      {creating && (
        <CreateForm
          supabase={supabase}
          onCreated={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {loading ? (
        <PanelSpinner />
      ) : rows.length === 0 ? (
        <PanelEmpty>No redirects yet.</PanelEmpty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-foreground-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">From → To</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Hits</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-surface-secondary/40"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-xs text-foreground">
                      {r.from_path}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-foreground-tertiary">
                      → {r.to_path}
                    </div>
                    {r.notes && (
                      <p className="mt-1 text-[11px] text-foreground-tertiary">
                        {r.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-foreground-secondary">
                    {r.redirect_type}
                  </td>
                  <td className="px-4 py-3 align-top text-foreground-secondary">
                    {r.hits}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button onClick={() => handleToggle(r)}>
                      <StatusBadge
                        status={r.is_active ? "active" : "off"}
                        tone={r.is_active ? "success" : "neutral"}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <button
                      onClick={() => handleDelete(r)}
                      className="text-xs text-foreground-tertiary transition-colors hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateForm({
  supabase,
  onCreated,
}: {
  supabase: SupabaseClient;
  onCreated: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<301 | 302 | 307>(301);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createRedirect(supabase, from, to, type, notes || undefined);
      setFrom("");
      setTo("");
      setNotes("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-border bg-surface p-4"
    >
      <PanelError message={error} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="From path" required>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="/old-pricing"
            required
            className={inputClass}
          />
        </Field>
        <Field label="To path / URL" required>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="/pricing"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Type">
          <select
            value={type}
            onChange={(e) =>
              setType(parseInt(e.target.value, 10) as 301 | 302 | 307)
            }
            className={inputClass}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create redirect"}
        </PrimaryButton>
      </div>
    </form>
  );
}

// Avoid unused-export warning; GhostButton kept for symmetry with other panels.
void GhostButton;
