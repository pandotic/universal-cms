"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteProjectSection,
  getProjectSections,
  upsertProjectSection,
} from "@pandotic/universal-cms/data/projects";
import type {
  ProjectSection,
  SectionType,
} from "@pandotic/universal-cms/types/projects";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface SectionMeta {
  type: SectionType;
  label: string;
  description: string;
  defaultTitle: string;
  rows: number;
  placeholder?: string;
}

const SECTIONS: SectionMeta[] = [
  {
    type: "product-page",
    label: "Product Page",
    description: "Main product hero, intro, and primary CTA copy.",
    defaultTitle: "Product",
    rows: 12,
    placeholder: "## Hero\n\nProduct overview…",
  },
  {
    type: "case-study",
    label: "Case Study",
    description: "Long-form narrative: problem, approach, outcome.",
    defaultTitle: "Case Study",
    rows: 14,
  },
  {
    type: "features",
    label: "Features",
    description:
      "Feature blocks. Parsed by data/project-parsers — see ParsedFeature shape.",
    defaultTitle: "Features",
    rows: 12,
  },
  {
    type: "proof-points",
    label: "Proof Points",
    description: "Numbered statements that anchor the case (1–N).",
    defaultTitle: "Proof Points",
    rows: 10,
  },
  {
    type: "tech-differentiators",
    label: "Tech Differentiators",
    description: "What is technically novel or harder than it looks.",
    defaultTitle: "Tech Differentiators",
    rows: 10,
  },
  {
    type: "blurbs",
    label: "Blurbs",
    description: "Short pull-quotes / one-liners used across templates.",
    defaultTitle: "Blurbs",
    rows: 8,
  },
  {
    type: "portfolio",
    label: "Portfolio",
    description: "Related work / linked projects shown alongside.",
    defaultTitle: "Portfolio",
    rows: 8,
  },
];

interface SectionDraft {
  id?: string;
  title: string;
  content: string;
  sort_order: number;
}

const EMPTY: SectionDraft = { title: "", content: "", sort_order: 0 };

export function ProjectSectionsEditor({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [drafts, setDrafts] = useState<Record<SectionType, SectionDraft>>(
    () =>
      Object.fromEntries(SECTIONS.map((s) => [s.type, EMPTY])) as Record<
        SectionType,
        SectionDraft
      >,
  );
  const [savingType, setSavingType] = useState<SectionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getProjectSections(supabase, projectId);
      const next = Object.fromEntries(
        SECTIONS.map((s) => {
          const found = rows.find((r) => r.section_type === s.type);
          return [
            s.type,
            found
              ? {
                  id: found.id,
                  title: found.title,
                  content: found.content,
                  sort_order: found.sort_order,
                }
              : EMPTY,
          ];
        }),
      ) as Record<SectionType, SectionDraft>;
      setDrafts(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sections");
    } finally {
      setLoading(false);
    }
  }, [supabase, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function update(
    type: SectionType,
    field: keyof SectionDraft,
    value: string | number,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
    setMessage(null);
  }

  async function handleSave(meta: SectionMeta) {
    setSavingType(meta.type);
    setError(null);
    setMessage(null);
    try {
      const draft = drafts[meta.type];
      const saved = await upsertProjectSection(supabase, {
        project_id: projectId,
        section_type: meta.type,
        title: draft.title || meta.defaultTitle,
        content: draft.content,
        sort_order: draft.sort_order,
      } as Partial<ProjectSection> & {
        project_id: string;
        section_type: SectionType;
      });
      setDrafts((prev) => ({
        ...prev,
        [meta.type]: {
          id: saved.id,
          title: saved.title,
          content: saved.content,
          sort_order: saved.sort_order,
        },
      }));
      setMessage(`Saved ${meta.label}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setSavingType(null);
    }
  }

  async function handleClear(meta: SectionMeta) {
    const draft = drafts[meta.type];
    if (!draft.id) {
      setDrafts((prev) => ({ ...prev, [meta.type]: EMPTY }));
      return;
    }
    if (!confirm(`Delete the ${meta.label} section content?`)) return;
    try {
      await deleteProjectSection(supabase, draft.id);
      setDrafts((prev) => ({ ...prev, [meta.type]: EMPTY }));
      setMessage(`Cleared ${meta.label}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-sm text-emerald-400">{message}</p>
        </div>
      )}

      {SECTIONS.map((meta) => {
        const draft = drafts[meta.type];
        const isExisting = !!draft.id;
        return (
          <details
            key={meta.type}
            className="overflow-hidden rounded-lg border border-border bg-surface"
            open={isExisting}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {meta.label}
                  {isExisting && (
                    <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      saved
                    </span>
                  )}
                </h3>
                <p className="mt-0.5 text-xs text-foreground-tertiary">
                  {meta.description}
                </p>
              </div>
              <span className="font-mono text-[10px] text-foreground-tertiary">
                {meta.type}
              </span>
            </summary>

            <div className="space-y-3 border-t border-border px-4 py-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
                    Title
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) =>
                      update(meta.type, "title", e.target.value)
                    }
                    placeholder={meta.defaultTitle}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
                    Sort order
                  </label>
                  <input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) =>
                      update(
                        meta.type,
                        "sort_order",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
                  Content (markdown)
                </label>
                <textarea
                  value={draft.content}
                  onChange={(e) =>
                    update(meta.type, "content", e.target.value)
                  }
                  rows={meta.rows}
                  placeholder={meta.placeholder}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-border-strong focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSave(meta)}
                  disabled={savingType === meta.type}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-surface transition-colors hover:bg-foreground-secondary disabled:opacity-50"
                >
                  {savingType === meta.type
                    ? "Saving…"
                    : isExisting
                      ? "Save section"
                      : "Create section"}
                </button>
                {isExisting && (
                  <button
                    type="button"
                    onClick={() => handleClear(meta)}
                    className="text-xs text-foreground-tertiary transition-colors hover:text-red-400"
                  >
                    Delete section
                  </button>
                )}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
