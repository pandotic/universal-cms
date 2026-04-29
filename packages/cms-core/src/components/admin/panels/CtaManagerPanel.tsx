"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CtaBlock,
  type CtaBlockStatus,
  createCtaBlock,
  deleteCtaBlock,
  getAllCtaBlocks,
  updateCtaBlock,
} from "../../../data/cta-blocks.js";
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

const STATUSES: CtaBlockStatus[] = ["draft", "active", "archived"];

const STATUS_TONES: Record<CtaBlockStatus, "success" | "warning" | "neutral"> =
  {
    active: "success",
    draft: "warning",
    archived: "neutral",
  };

export interface CtaManagerPanelProps {
  supabase: SupabaseClient;
}

export function CtaManagerPanel({ supabase }: CtaManagerPanelProps) {
  const [rows, setRows] = useState<CtaBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CtaBlock | "new" | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getAllCtaBlocks(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CTAs");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(c: CtaBlock) {
    if (!confirm(`Delete CTA "${c.name}"?`)) return;
    try {
      await deleteCtaBlock(supabase, c.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (editing) {
    return (
      <CtaEditor
        supabase={supabase}
        block={editing === "new" ? undefined : editing}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeading
        title="CTA Manager"
        description={`${rows.length} call-to-action blocks. Reusable across pages and placements.`}
        actions={
          <PrimaryButton type="button" onClick={() => setEditing("new")}>
            New CTA
          </PrimaryButton>
        }
      />
      <PanelError message={error} />

      {loading ? (
        <PanelSpinner />
      ) : rows.length === 0 ? (
        <PanelEmpty>No CTAs yet.</PanelEmpty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-foreground-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Placement</th>
                <th className="px-4 py-3 text-left font-medium">Heading</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-surface-secondary/40"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(c)}
                      className="text-left font-medium text-foreground hover:underline"
                    >
                      {c.name}
                    </button>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      {c.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {c.placement}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {c.heading}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} tone={STATUS_TONES[c.status]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(c)}
                      className="mr-3 text-xs text-foreground-secondary hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-xs text-foreground-tertiary hover:text-red-400"
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

function CtaEditor({
  supabase,
  block,
  onSaved,
  onCancel,
}: {
  supabase: SupabaseClient;
  block?: CtaBlock;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState({
    name: block?.name ?? "",
    slug: block?.slug ?? "",
    placement: block?.placement ?? "footer",
    heading: block?.heading ?? "",
    subheading: block?.subheading ?? "",
    primary_button_text: block?.primary_button_text ?? "",
    primary_button_url: block?.primary_button_url ?? "",
    secondary_button_text: block?.secondary_button_text ?? "",
    secondary_button_url: block?.secondary_button_url ?? "",
    status: block?.status ?? ("draft" as CtaBlockStatus),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<CtaBlock> = {
        name: draft.name,
        slug: draft.slug,
        placement: draft.placement,
        heading: draft.heading,
        subheading: draft.subheading || null,
        primary_button_text: draft.primary_button_text || null,
        primary_button_url: draft.primary_button_url || null,
        secondary_button_text: draft.secondary_button_text || null,
        secondary_button_url: draft.secondary_button_url || null,
        status: draft.status,
      };
      if (block) {
        await updateCtaBlock(supabase, block.id, payload);
      } else {
        await createCtaBlock(supabase, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <PanelHeading
        title={block ? `Edit: ${block.name}` : "New CTA"}
        description={
          block
            ? `slug: ${block.slug}`
            : "Reusable call-to-action — place by name in templates."
        }
      />
      <PanelError message={error} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Name" required>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Slug" required>
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Placement">
          <input
            type="text"
            value={draft.placement}
            onChange={(e) => set("placement", e.target.value)}
            placeholder="footer / inline / sidebar"
            className={inputClass}
          />
        </Field>
        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as CtaBlockStatus)}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Heading" required>
        <input
          type="text"
          value={draft.heading}
          onChange={(e) => set("heading", e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Subheading">
        <textarea
          value={draft.subheading}
          onChange={(e) => set("subheading", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="rounded-lg border border-border bg-surface p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
          Buttons
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Primary text">
            <input
              type="text"
              value={draft.primary_button_text}
              onChange={(e) => set("primary_button_text", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Primary URL">
            <input
              type="text"
              value={draft.primary_button_url}
              onChange={(e) => set("primary_button_url", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Secondary text">
            <input
              type="text"
              value={draft.secondary_button_text}
              onChange={(e) => set("secondary_button_text", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Secondary URL">
            <input
              type="text"
              value={draft.secondary_button_url}
              onChange={(e) => set("secondary_button_url", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : block ? "Save changes" : "Create CTA"}
        </PrimaryButton>
        <GhostButton type="button" onClick={onCancel}>
          Cancel
        </GhostButton>
      </div>
    </form>
  );
}
