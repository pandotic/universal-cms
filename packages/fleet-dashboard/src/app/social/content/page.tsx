"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminConfig } from "@/config/admin-config";
import type {
  SocialContentItem,
  SocialPlatform,
  SocialContentType,
  SocialContentStatus,
  BrandVoiceBrief,
} from "@pandotic/universal-cms/types/social";

interface Property {
  id: string;
  name: string;
  slug: string;
}

const PLATFORMS: SocialPlatform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "other",
];

const CONTENT_TYPES: SocialContentType[] = [
  "post",
  "thread",
  "story",
  "reel",
  "article",
];

const STATUSES: SocialContentStatus[] = [
  "draft",
  "review",
  "approved",
  "published",
  "archived",
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400",
  review: "bg-amber-500/10 text-amber-400",
  approved: "bg-blue-500/10 text-blue-400",
  published: "bg-emerald-500/10 text-emerald-400",
  archived: "bg-zinc-700/10 text-zinc-500",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  linkedin: "bg-blue-500/10 text-blue-400",
  instagram: "bg-pink-500/10 text-pink-400",
  facebook: "bg-indigo-500/10 text-indigo-400",
  tiktok: "bg-zinc-500/10 text-zinc-300",
  youtube: "bg-red-500/10 text-red-400",
  other: "bg-zinc-500/10 text-zinc-400",
};

export default function SocialContentPage() {
  const [content, setContent] = useState<SocialContentItem[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [briefs, setBriefs] = useState<BrandVoiceBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Create form state
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formBriefId, setFormBriefId] = useState("");
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>("twitter");
  const [formContentType, setFormContentType] = useState<SocialContentType>("post");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formHashtags, setFormHashtags] = useState("");
  const [formStatus, setFormStatus] = useState<SocialContentStatus>("draft");

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadContent();
  }, [propertyFilter, platformFilter, statusFilter]);

  useEffect(() => {
    if (formPropertyId) {
      fetch(`/api/social/briefs?propertyId=${formPropertyId}`)
        .then((r) => r.json())
        .then((d) => setBriefs(d.data ?? []))
        .catch(() => {});
    } else {
      setBriefs([]);
    }
  }, [formPropertyId]);

  async function loadProperties() {
    const res = await fetch("/api/properties");
    const data = await res.json();
    setProperties(data.data ?? []);
  }

  async function loadContent() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.set("propertyId", propertyFilter);
      if (platformFilter) params.set("platform", platformFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/social/content?${params}`);
      const data = await res.json();
      setContent(data.data ?? []);
    } catch {
      showToast("Failed to load content");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function getPropertyName(id: string) {
    return properties.find((p) => p.id === id)?.name ?? "Unknown";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/social/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: formPropertyId,
          brief_id: formBriefId || null,
          platform: formPlatform,
          content_type: formContentType,
          title: formTitle || null,
          body: formBody,
          hashtags: formHashtags
            ? formHashtags.split(",").map((h) => h.trim().replace(/^#/, ""))
            : [],
          status: formStatus,
        }),
      });

      if (res.ok) {
        showToast("Content created");
        setShowCreate(false);
        resetForm();
        loadContent();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to create content");
      }
    } catch {
      showToast("Failed to create content");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setFormPropertyId("");
    setFormBriefId("");
    setFormPlatform("twitter");
    setFormContentType("post");
    setFormTitle("");
    setFormBody("");
    setFormHashtags("");
    setFormStatus("draft");
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const res = await fetch(`/api/social/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      showToast(`Content ${newStatus}`);
      loadContent();
    } else {
      showToast("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content item?")) return;

    const res = await fetch(`/api/social/content/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      showToast("Content deleted");
      loadContent();
    } else {
      showToast("Failed to delete content");
    }
  }

  if (!adminConfig.features.social) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">
          Social content management is not enabled in this configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/social"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            &larr; Back to Social
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Social Content
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage social media content across platforms
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          {showCreate ? "Cancel" : "Create Content"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Property
              </label>
              <select
                required
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              >
                <option value="">Select property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value as SocialPlatform)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Content Type
              </label>
              <select
                value={formContentType}
                onChange={(e) =>
                  setFormContentType(e.target.value as SocialContentType)
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Brand Voice Brief (optional)
              </label>
              <select
                value={formBriefId}
                onChange={(e) => setFormBriefId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              >
                <option value="">None</option>
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) =>
                  setFormStatus(e.target.value as SocialContentStatus)
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              >
                {STATUSES.filter((s) => s !== "archived").map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              placeholder="Post title or headline"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Body
            </label>
            <textarea
              required
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              placeholder="Write your post content..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Hashtags (comma-separated)
            </label>
            <input
              type="text"
              value={formHashtags}
              onChange={(e) => setFormHashtags(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              placeholder="seo, marketing, tech"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Content"}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Content table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-4 text-sm text-zinc-500">Loading content...</p>
        </div>
      ) : content.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-sm text-zinc-500">No content found</p>
          <p className="mt-1 text-xs text-zinc-600">
            Create social content to get started
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                  Content
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                  Property
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                  Platform
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {content.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <p className="text-white truncate max-w-xs">
                      {item.title ?? item.body.slice(0, 60)}
                    </p>
                    {item.hashtags.length > 0 && (
                      <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-xs">
                        {item.hashtags.map((h) => `#${h}`).join(" ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">
                    {getPropertyName(item.property_id)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        PLATFORM_COLORS[item.platform] ?? PLATFORM_COLORS.other
                      }`}
                    >
                      {item.platform}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs capitalize">
                    {item.content_type}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[item.status] ?? STATUS_COLORS.draft
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {item.status !== "published" &&
                        item.status !== "archived" && (
                          <button
                            onClick={() =>
                              handleStatusChange(item.id, "published")
                            }
                            className="rounded px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-500/10"
                          >
                            Publish
                          </button>
                        )}
                      {item.status !== "archived" && (
                        <button
                          onClick={() =>
                            handleStatusChange(item.id, "archived")
                          }
                          className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-500/10"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
