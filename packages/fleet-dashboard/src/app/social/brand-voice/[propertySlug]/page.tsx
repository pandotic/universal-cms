"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { BrandVoiceBrief } from "@pandotic/universal-cms/types/social";

interface Property {
  id: string;
  name: string;
  slug: string;
}

function splitComma(val: string): string[] {
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function PropertyBrandVoicePage({
  params,
}: {
  params: Promise<{ propertySlug: string }>;
}) {
  const { propertySlug } = use(params);

  const [property, setProperty] = useState<Property | null>(null);
  const [briefs, setBriefs] = useState<BrandVoiceBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState("");
  const [formTone, setFormTone] = useState("");
  const [formAudience, setFormAudience] = useState("");
  const [formKeyMessages, setFormKeyMessages] = useState("");
  const [formDos, setFormDos] = useState("");
  const [formDonts, setFormDonts] = useState("");
  const [formExamplePosts, setFormExamplePosts] = useState("{}");

  useEffect(() => {
    loadProperty();
  }, [propertySlug]);

  useEffect(() => {
    if (property) loadBriefs();
  }, [property]);

  async function loadProperty() {
    const res = await fetch("/api/properties");
    const data = await res.json();
    const found = (data.data ?? []).find((p: Property) => p.slug === propertySlug);
    setProperty(found ?? null);
    if (!found) setLoading(false);
  }

  async function loadBriefs() {
    if (!property) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/social/briefs?propertyId=${property.id}`);
      const data = await res.json();
      setBriefs(data.data ?? []);
      // Auto-show create if no briefs exist
      if ((data.data ?? []).length === 0) setShowCreate(true);
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

  function resetForm() {
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
    setShowCreate(false);
    setFormName(brief.name);
    setFormPlatform(brief.platform);
    setFormTone(brief.tone?.join(", ") ?? "");
    setFormAudience(brief.audience);
    setFormKeyMessages(brief.key_messages?.join(", ") ?? "");
    setFormDos(brief.dos?.join(", ") ?? "");
    setFormDonts(brief.donts?.join(", ") ?? "");
    setFormExamplePosts(JSON.stringify(brief.example_posts ?? {}, null, 2));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    try {
      let examplePosts = {};
      try { examplePosts = JSON.parse(formExamplePosts); } catch {
        showToast("Invalid JSON in example posts");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/social/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
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
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      let examplePosts = {};
      try { examplePosts = JSON.parse(formExamplePosts); } catch {
        showToast("Invalid JSON in example posts");
        setSaving(false);
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
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand voice brief?")) return;
    const res = await fetch(`/api/social/briefs/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Brief deleted");
      loadBriefs();
    } else {
      showToast("Failed to delete brief");
    }
  }

  if (!loading && !property) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-red-400">Property not found</p>
        <Link href="/social/brand-voice" className="mt-2 inline-block text-sm text-zinc-400 hover:text-white">
          &larr; Back to Brand Voice
        </Link>
      </div>
    );
  }

  const isEditing = editingId !== null;
  const showForm = showCreate || isEditing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/social/brand-voice" className="text-sm text-zinc-500 hover:text-white transition-colors">
            &larr; Back to Brand Voice
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Brand Voice — {property?.name ?? "..."}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Define tone, audience, and messaging guidelines
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) { setShowCreate(false); setEditingId(null); resetForm(); }
            else setShowCreate(true);
          }}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          {showForm ? "Cancel" : "Create Brief"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={isEditing ? handleUpdate : handleCreate}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Brief Name</label>
              <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="e.g. Twitter Strategy Q1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Platform Focus</label>
              <input type="text" value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="e.g. Twitter/LinkedIn" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tone (comma-separated)</label>
              <input type="text" value={formTone} onChange={(e) => setFormTone(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="professional, friendly, authoritative" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Audience</label>
              <input type="text" value={formAudience} onChange={(e) => setFormAudience(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="Tech professionals, startup founders" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Key Messages (comma-separated)</label>
            <input type="text" value={formKeyMessages} onChange={(e) => setFormKeyMessages(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              placeholder="Innovation matters, User-first design" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Do&apos;s (comma-separated)</label>
              <textarea value={formDos} onChange={(e) => setFormDos(e.target.value)} rows={2}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="Use active voice, Include data points" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Don&apos;ts (comma-separated)</label>
              <textarea value={formDonts} onChange={(e) => setFormDonts(e.target.value)} rows={2}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                placeholder="Avoid jargon, Don't be overly promotional" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Example Posts (JSON)</label>
            <textarea value={formExamplePosts} onChange={(e) => setFormExamplePosts(e.target.value)} rows={3}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-white/25" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50">
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Brief"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="mt-4 text-sm text-zinc-500">Loading briefs...</p>
        </div>
      ) : briefs.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-sm text-zinc-500">No brand voice briefs for this property</p>
          <p className="mt-1 text-xs text-zinc-600">Create one to define your brand voice</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {briefs.map((brief) => (
            <div key={brief.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">{brief.name}</h3>
                  {brief.platform && <p className="text-xs text-zinc-500 mt-0.5">{brief.platform}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(brief)}
                    className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white">Edit</button>
                  <button onClick={() => handleDelete(brief.id)}
                    className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10">Delete</button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                {brief.tone?.length > 0 && (
                  <div>
                    <p className="font-medium text-zinc-500 mb-1">Tone</p>
                    <div className="flex flex-wrap gap-1">
                      {brief.tone.map((t) => (
                        <span key={t} className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">{t}</span>
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
                    <p className="font-medium text-zinc-500 mb-1">Key Messages ({brief.key_messages.length})</p>
                    <p className="text-zinc-400 truncate">{brief.key_messages.join(", ")}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  {brief.dos?.length > 0 && <p className="font-medium text-emerald-500">Do&apos;s ({brief.dos.length})</p>}
                  {brief.donts?.length > 0 && <p className="font-medium text-red-500">Don&apos;ts ({brief.donts.length})</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
