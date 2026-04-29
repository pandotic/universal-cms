"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContentPage,
  updateContentPage,
} from "../../../data/content-pages.js";
import type {
  ContentPage,
  PageStatus,
  PageType,
} from "../../../types/index.js";
import { cn } from "../../../utils/index.js";

const PAGE_TYPES: PageType[] = ["article", "guide", "landing", "custom"];
const PAGE_STATUSES: PageStatus[] = ["draft", "published", "archived"];

export interface ContentPageEditorProps {
  /** Existing page being edited. Omit for the create flow. */
  page?: ContentPage;
  supabase: SupabaseClient;
  /** Called on successful save with the updated/created row. */
  onSave?: (page: ContentPage) => void | Promise<void>;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
  className?: string;
}

interface DraftState {
  title: string;
  slug: string;
  page_type: PageType;
  status: PageStatus;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
}

function toDraft(page?: ContentPage): DraftState {
  return {
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    page_type: (page?.page_type ?? "article") as PageType,
    status: (page?.status ?? "draft") as PageStatus,
    excerpt: page?.excerpt ?? "",
    body: page?.body ?? "",
    seo_title: page?.seo_title ?? "",
    seo_description: page?.seo_description ?? "",
    og_image: page?.og_image ?? "",
  };
}

/**
 * Universal content-page editor. Works for both create and edit flows —
 * pass the existing `page` to edit, omit for a new draft. Uses cms-core's
 * `data/content-pages` helpers, so the consuming site only needs to pass
 * an authenticated Supabase client.
 */
export function ContentPageEditor({
  page,
  supabase,
  onSave,
  onCancel,
  className,
}: ContentPageEditorProps) {
  const isEdit = !!page;
  const [draft, setDraft] = useState<DraftState>(() => toDraft(page));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function autoSlug(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 96);
    update("slug", slug);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<ContentPage> = {
        title: draft.title,
        slug: draft.slug,
        page_type: draft.page_type,
        status: draft.status,
        excerpt: draft.excerpt || null,
        body: draft.body || null,
        seo_title: draft.seo_title || null,
        seo_description: draft.seo_description || null,
        og_image: draft.og_image || null,
      };
      if (
        draft.status === "published" &&
        (!page || page.status !== "published")
      ) {
        payload.published_at = new Date().toISOString();
      }
      const saved = isEdit
        ? await updateContentPage(supabase, page.id, payload)
        : await createContentPage(supabase, payload);
      await onSave?.(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {isEdit ? `Edit: ${page?.title || "(untitled)"}` : "New content page"}
        </h2>
        {isEdit && page?.updated_at && (
          <p className="text-xs text-foreground-tertiary">
            Updated {new Date(page.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <Field label="Title" required>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => {
                update("title", e.target.value);
                if (!isEdit && !draft.slug) autoSlug(e.target.value);
              }}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Slug" required help="URL path (no leading slash).">
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-surface-secondary px-3 text-xs text-foreground-tertiary">
                /
              </span>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => update("slug", e.target.value)}
                required
                className={cn(inputClass, "rounded-l-none")}
              />
            </div>
          </Field>
          <Field label="Excerpt" help="Short summary for list cards and social.">
            <textarea
              value={draft.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field
            label="Body"
            help="Markdown supported. Sites typically render this with their own MDX/markdown stack."
          >
            <textarea
              value={draft.body}
              onChange={(e) => update("body", e.target.value)}
              rows={18}
              className={cn(inputClass, "font-mono text-xs leading-relaxed")}
            />
          </Field>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) => update("status", e.target.value as PageStatus)}
              className={inputClass}
            >
              {PAGE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Page type">
            <select
              value={draft.page_type}
              onChange={(e) => update("page_type", e.target.value as PageType)}
              className={inputClass}
            >
              {PAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-lg border border-border bg-surface p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
              SEO &amp; social
            </h3>
            <div className="mt-3 space-y-3">
              <Field label="SEO title" help="Falls back to page title.">
                <input
                  type="text"
                  value={draft.seo_title}
                  onChange={(e) => update("seo_title", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Meta description">
                <textarea
                  value={draft.seo_description}
                  onChange={(e) =>
                    update("seo_description", e.target.value)
                  }
                  rows={3}
                  className={inputClass}
                />
              </Field>
              <Field label="OG image URL">
                <input
                  type="url"
                  value={draft.og_image}
                  onChange={(e) => update("og_image", e.target.value)}
                  placeholder="https://…/og.png"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-foreground-secondary disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create page"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none";

function Field({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline gap-2 text-xs font-medium text-foreground-secondary">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </span>
      </label>
      {children}
      {help && (
        <p className="mt-1 text-[11px] text-foreground-tertiary">{help}</p>
      )}
    </div>
  );
}
