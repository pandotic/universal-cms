"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteContentPage,
  getAllContentPages,
  updateContentPage,
} from "../../../data/content-pages.js";
import type { ContentPage, PageStatus } from "../../../types/index.js";
import {
  PanelEmpty,
  PanelError,
  PanelHeading,
  PanelSpinner,
  PrimaryButton,
  StatusBadge,
} from "./_shared.js";

const STATUS_TONES: Record<PageStatus, "success" | "warning" | "neutral"> = {
  published: "success",
  draft: "warning",
  archived: "neutral",
};

export interface LandingPagesPanelProps {
  supabase: SupabaseClient;
  /** Where the panel routes for "New" and row clicks. Defaults to
   * `/admin/landing` so consumers can mount this under any admin path. */
  basePath?: string;
}

/**
 * Landing pages — a filtered view of `content_pages` where
 * `page_type = 'landing'`. Shares the same data layer as Content Pages,
 * just narrows the list. Edit goes through ContentPageEditor mounted at
 * `${basePath}/[id]` and `${basePath}/new`.
 */
export function LandingPagesPanel({
  supabase,
  basePath = "/admin/landing",
}: LandingPagesPanelProps) {
  const [rows, setRows] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllContentPages(supabase);
      setRows(all.filter((p) => p.page_type === "landing"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleStatus(p: ContentPage) {
    const next: PageStatus = p.status === "published" ? "draft" : "published";
    try {
      await updateContentPage(supabase, p.id, {
        status: next,
        ...(next === "published"
          ? { published_at: new Date().toISOString() }
          : {}),
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(p: ContentPage) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteContentPage(supabase, p.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <PanelHeading
        title="Landing Pages"
        description={`${rows.length} landing pages. Conversion-focused content stored alongside articles.`}
        actions={
          <PrimaryButton
            type="button"
            onClick={() => {
              window.location.href = `${basePath}/new`;
            }}
          >
            New landing page
          </PrimaryButton>
        }
      />
      <PanelError message={error} />

      {loading ? (
        <PanelSpinner />
      ) : rows.length === 0 ? (
        <PanelEmpty>
          No landing pages yet. Create one or change a content page&rsquo;s
          type to <span className="font-mono">landing</span>.
        </PanelEmpty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-foreground-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-surface-secondary/40"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`${basePath}/${p.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {p.title}
                    </a>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      /{p.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(p)}>
                      <StatusBadge
                        status={p.status}
                        tone={STATUS_TONES[p.status]}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-tertiary">
                    {p.updated_at
                      ? new Date(p.updated_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`${basePath}/${p.id}`}
                      className="mr-3 text-xs text-foreground-secondary hover:text-foreground"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(p)}
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
