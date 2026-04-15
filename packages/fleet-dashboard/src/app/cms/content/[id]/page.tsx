"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type PageType = "article" | "guide" | "landing" | "custom";
type PageStatus = "draft" | "published" | "archived";

interface ContentPage {
  id?: string;
  slug: string;
  title: string;
  page_type: PageType;
  body: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  status: PageStatus;
  published_at: string | null;
}

export default function ContentPageEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const [page, setPage] = useState<ContentPage>({
    slug: "",
    title: "",
    page_type: "article",
    body: null,
    excerpt: null,
    seo_title: null,
    seo_description: null,
    og_image: null,
    status: "draft",
    published_at: null,
  });
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/cms/content/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.page) setPage(data.page);
        else setError("Page not found");
      })
      .catch(() => setError("Failed to load page"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/cms/content" : `/api/cms/content/${id}`;

      const payload = { ...page };
      if (payload.status === "published" && !payload.published_at) {
        payload.published_at = new Date().toISOString();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (isNew && data.page?.id) {
        router.push(`/cms/content/${data.page.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this content page? This cannot be undone.")) return;
    try {
      await fetch(`/api/cms/content/${id}`, { method: "DELETE" });
      router.push("/cms/content");
    } catch {
      setError("Delete failed");
    }
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/cms/content"
            className="text-zinc-400 hover:text-white text-sm"
          >
            &larr; Content Pages
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isNew ? "New Page" : page.title || "Edit Page"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "content"
              ? "border-white text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "seo"
              ? "border-white text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          SEO
        </button>
      </div>

      {/* Content tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={page.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setPage((p) => ({
                    ...p,
                    title,
                    slug: isNew && !p.slug ? autoSlug(title) : p.slug,
                  }));
                }}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Slug
              </label>
              <input
                type="text"
                value={page.slug}
                onChange={(e) =>
                  setPage((p) => ({ ...p, slug: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Page Type
              </label>
              <select
                value={page.page_type}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    page_type: e.target.value as PageType,
                  }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                <option value="article">Article</option>
                <option value="guide">Guide</option>
                <option value="landing">Landing</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                Status
              </label>
              <select
                value={page.status}
                onChange={(e) =>
                  setPage((p) => ({
                    ...p,
                    status: e.target.value as PageStatus,
                  }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              Excerpt
            </label>
            <textarea
              value={page.excerpt || ""}
              onChange={(e) =>
                setPage((p) => ({ ...p, excerpt: e.target.value || null }))
              }
              rows={2}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none resize-y"
              placeholder="Brief summary of the page..."
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              Body (Markdown)
            </label>
            <textarea
              value={page.body || ""}
              onChange={(e) =>
                setPage((p) => ({ ...p, body: e.target.value || null }))
              }
              rows={20}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 font-mono focus:border-zinc-500 focus:outline-none resize-y"
              placeholder="Write your content in markdown..."
            />
          </div>
        </div>
      )}

      {/* SEO tab */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              SEO Title
            </label>
            <input
              type="text"
              value={page.seo_title || ""}
              onChange={(e) =>
                setPage((p) => ({ ...p, seo_title: e.target.value || null }))
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              placeholder="Defaults to page title if empty"
            />
            <p className="mt-1 text-xs text-zinc-600">
              {(page.seo_title || page.title).length}/60 characters
            </p>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              SEO Description
            </label>
            <textarea
              value={page.seo_description || ""}
              onChange={(e) =>
                setPage((p) => ({
                  ...p,
                  seo_description: e.target.value || null,
                }))
              }
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none resize-y"
              placeholder="Concise description for search engines..."
            />
            <p className="mt-1 text-xs text-zinc-600">
              {(page.seo_description || "").length}/160 characters
            </p>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5">
              OG Image URL
            </label>
            <input
              type="text"
              value={page.og_image || ""}
              onChange={(e) =>
                setPage((p) => ({ ...p, og_image: e.target.value || null }))
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          {/* SEO Preview */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs font-medium text-zinc-500 mb-3">
              Search Preview
            </p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-400 truncate">
                {page.seo_title || page.title || "Page Title"}
              </p>
              <p className="text-xs text-emerald-400">
                pandotic.ai/{page.slug || "page-slug"}
              </p>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {page.seo_description ||
                  page.excerpt ||
                  "No description provided"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
