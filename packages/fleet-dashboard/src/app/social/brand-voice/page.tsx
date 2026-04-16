"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminConfig } from "@/config/admin-config";
import type { BrandVoiceBrief } from "@pandotic/universal-cms/types/social";

interface Property {
  id: string;
  name: string;
  slug: string;
}

export default function BrandVoicePage() {
  const [briefs, setBriefs] = useState<BrandVoiceBrief[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState("");
  const [formTone, setFormTone] = useState("");
  const [formAudience, setFormAudience] = useState("");
  const [formKeyMessages, setFormKeyMessages] = useState("");
  const [formDos, setFormDos] = useState("");
  const [formDonts, setFormDonts] = useState("");
  const [formExamplePosts, setFormExamplePosts] = useState("{}");

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadBriefs();
  }, [propertyFilter]);

  async function loadProperties() {
    const res = await fetch("/api/properties");
    const data = await res.json();
    setProperties(data.data ?? []);
  }

  async function loadBriefs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyFilter) params.set("propertyId", propertyFilter);

      const res = await fetch(`/api/social/briefs?${params}`);
      const data = await res.json();
      setBriefs(data.data ?? []);
    } catch {
      showToast("Failed to load briefs");
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

  function resetForm() {
    setFormPropertyId("");
    setFormName("");
    setFormPlatform("");
    setFormTone("");
    setFormAudience("");
    setFormKeyMessages("");
    setFormDos("");
    setFormDonts("");
    setFormExamplePosts("{}");
  }

  function startEdit(brief: BrandVoiceBrief) {
    setEditingId(brief.id);
    setFormPropertyId(brief.property_id);
    setFormName(brief.name);
    setFormPlatform(brief.platform);
    setFormTone(brief.tone?.join(", ") ?? "");
    setFormAudience(brief.audience);
    setFormKeyMessages(brief.key_messages?.join(", ") ?? "");
    setFormDos(brief.dos?.join(", ") ?? "");
    setFormDonts(brief.donts?.join(", ") ?? "");
    setFormExamplePosts(JSON.stringify(brief.example_posts ?? {}, null, 2));
    setShowCreate(false);
  }

  function splitComma(val: string): string[] {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      let examplePosts = {};
      try {
        examplePosts = JSON.parse(formExamplePosts);
      } catch {
        showToast("Invalid JSON in example posts");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/social/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: formPropertyId,
          name: formName,
          platform: formPlatform,
          tone: splitComma(formTone),
          audience: formAudience,
          key_messages: splitComma(formKeyMessages),
          dos: splitComma(formDos),
          donts: splitComma(formDonts),
          example_posts: examplePosts,
        }),
      });

      if (res.ok) {
        showToast("Brief created");
        setShowCreate(false);
        resetForm();
        loadBriefs();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to create brief");
      }
    } catch {
      showToast("Failed to create brief");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setCreating(true);
    try {
      let examplePosts = {};
      try {
        examplePosts = JSON.parse(formExamplePosts);
      } catch {
        showToast("Invalid JSON in example posts");
        setCreating(false);
        return;
      }

      const res = await fetch(`/api/social/briefs/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          platform: formPlatform,
          tone: splitComma(formTone),
          audience: formAudience,
          key_messages: splitComma(formKeyMessages),
          dos: splitComma(formDos),
          donts: splitComma(formDonts),
          example_posts: examplePosts,
        }),
      });

      if (res.ok) {
        showToast("Brief updated");
        setEditingId(null);
        resetForm();
        loadBriefs();
      } else {
        showToast("Failed to update brief");
      }
    } catch {
      showToast("Failed to update brief");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand voice brief?")) return;

    const res = await fetch(`/api/social/briefs/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      showToast("Brief deleted");
      loadBriefs();
    } else {
      showToast("Failed to delete brief");
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

  const isEditing = editingId !== null;
  const showForm = showCreate || isEditing;

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
            Brand Voice Briefs
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Define tone, audience, and messaging guidelines per property
          </p>
        </div>
        <button
          onClick={() => {
            if (showCreate || isEditing) {
              setShowCreate(false);
              setEditingId(null);
              resetForm();
            } else {
              setShowCreate(true);
            }
          }}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "Create Brief"}
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form
          onSubmit={isEditing ? handleUpdate : handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Property
              </label>
              <select
                required
                disabled={isEditing}
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25 disabled:opacity-50"
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
                Brief Name
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="e.g. Twitter Strategy Q1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Platform Focus
              </label>
              <input
                type="text"
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="e.g. Twitter/LinkedIn"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Tone (comma-separated)
              </label>
              <input
                type="text"
                value={formTone}
                onChange={(e) => setFormTone(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="professional, friendly, authoritative"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Audience
              </label>
              <input
                type="text"
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="Tech professionals, startup founders"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Key Messages (comma-separated)
            </label>
            <input
              type="text"
              value={formKeyMessages}
              onChange={(e) => setFormKeyMessages(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              placeholder="Innovation matters, User-first design, Data-driven decisions"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Do&apos;s (comma-separated)
              </label>
              <textarea
                value={formDos}
                onChange={(e) => setFormDos(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="Use active voice, Include data points"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Don&apos;ts (comma-separated)
              </label>
              <textarea
                value={formDonts}
                onChange={(e) => setFormDonts(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="Avoid jargon, Don't be overly promotional"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Example Posts (JSON)
            </label>
            <textarea
              value={formExamplePosts}
              onChange={(e) => setFormExamplePosts(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-white/25"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {creating
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Brief"}
          </button>
        </form>
      )}

      {/* Filter */}
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
      </div>

      {/* Briefs list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-4 text-sm text-zinc-500">Loading briefs...</p>
        </div>
      ) : briefs.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-sm text-zinc-500">No brand voice briefs found</p>
          <p className="mt-1 text-xs text-zinc-600">
            Create a brief to define your brand voice per property
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {briefs.map((brief) => (
            <div
              key={brief.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {brief.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {getPropertyName(brief.property_id)}
                    {brief.platform && ` · ${brief.platform}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(brief)}
                    className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brief.id)}
                    className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                {brief.tone?.length > 0 && (
                  <div>
                    <p className="font-medium text-zinc-500 mb-1">Tone</p>
                    <div className="flex flex-wrap gap-1">
                      {brief.tone.map((t) => (
                        <span
                          key={t}
                          className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {brief.audience && (
                  <div>
                    <p className="font-medium text-zinc-500 mb-1">Audience</p>
                    <p className="text-zinc-400">{brief.audience}</p>
                  </div>
                )}
                {brief.key_messages?.length > 0 && (
                  <div>
                    <p className="font-medium text-zinc-500 mb-1">
                      Key Messages ({brief.key_messages.length})
                    </p>
                    <p className="text-zinc-400 truncate">
                      {brief.key_messages.join(", ")}
                    </p>
                  </div>
                )}
                <div className="flex gap-4">
                  {brief.dos?.length > 0 && (
                    <div>
                      <p className="font-medium text-emerald-500 mb-1">
                        Do&apos;s ({brief.dos.length})
                      </p>
                    </div>
                  )}
                  {brief.donts?.length > 0 && (
                    <div>
                      <p className="font-medium text-red-500 mb-1">
                        Don&apos;ts ({brief.donts.length})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
