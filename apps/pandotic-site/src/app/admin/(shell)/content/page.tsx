"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllContentPages,
  updateContentPage,
  deleteContentPage,
} from "@pandotic/universal-cms/data/content";
import type { ContentPage } from "@pandotic/universal-cms/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ContentPagesAdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getAllContentPages(supabase);
      setPages(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleStatusToggle(page: ContentPage) {
    const next = page.status === "published" ? "draft" : "published";
    try {
      await updateContentPage(supabase, page.id, {
        status: next,
        ...(next === "published"
          ? { published_at: new Date().toISOString() }
          : {}),
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleDelete(page: ContentPage) {
    if (!confirm(`Delete page "${page.title}"?`)) return;
    try {
      await deleteContentPage(supabase, page.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete page");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Content Pages
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Articles, guides, landing pages, and custom routes. {pages.length}{" "}
          total.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground-secondary">
            No content pages found
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-foreground-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="transition-colors hover:bg-surface-secondary/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {page.title}
                    </span>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      /{page.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-foreground-secondary">
                    {page.page_type}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusToggle(page)}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        page.status === "published"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : page.status === "archived"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-surface-tertiary text-foreground-secondary"
                      }`}
                    >
                      {page.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-tertiary">
                    {page.updated_at
                      ? new Date(page.updated_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(page)}
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
