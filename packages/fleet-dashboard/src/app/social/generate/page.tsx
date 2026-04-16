"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminConfig } from "@/config/admin-config";
import type { BrandVoiceBrief, SocialPlatform } from "@pandotic/universal-cms/types/social";

interface Property {
  id: string;
  name: string;
  slug: string;
}

interface GeneratedPost {
  platform: string;
  title: string | null;
  body: string;
  hashtags: string[];
}

const ALL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  linkedin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  facebook: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  tiktok: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
  youtube: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function GenerateContentPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [briefs, setBriefs] = useState<BrandVoiceBrief[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedBrief, setSelectedBrief] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((d) => setProperties(d.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetch(`/api/social/briefs?propertyId=${selectedProperty}`)
        .then((r) => r.json())
        .then((d) => setBriefs(d.data ?? []))
        .catch(() => {});
    } else {
      setBriefs([]);
      setSelectedBrief("");
    }
  }, [selectedProperty]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleGenerate() {
    if (!topic.trim() || selectedPlatforms.length === 0) {
      showToast("Enter a topic and select at least one platform");
      return;
    }
    setGenerating(true);
    setGenerated([]);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProperty || undefined,
          briefId: selectedBrief || undefined,
          platforms: selectedPlatforms,
          topic,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setGenerated(data.data);
        showToast(`Generated ${data.data.length} posts`);
      } else {
        showToast(data.error ?? "Generation failed");
      }
    } catch {
      showToast("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function updatePost(index: number, field: keyof GeneratedPost, value: string | string[]) {
    setGenerated((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSaveAll() {
    if (!selectedProperty) {
      showToast("Select a property to save content");
      return;
    }
    setSaving(true);
    try {
      let saved = 0;
      for (const post of generated) {
        const res = await fetch("/api/social/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: selectedProperty,
            brief_id: selectedBrief || null,
            platform: post.platform,
            content_type: "post",
            title: post.title,
            body: post.body,
            hashtags: post.hashtags,
            status: "draft",
          }),
        });
        if (res.ok) saved++;
      }
      showToast(`Saved ${saved} of ${generated.length} posts as drafts`);
      setGenerated([]);
    } catch {
      showToast("Failed to save posts");
    } finally {
      setSaving(false);
    }
  }

  if (!adminConfig.features.social) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">Social content management is not enabled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/social" className="text-sm text-zinc-500 hover:text-white transition-colors">
          &larr; Back to Social
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Generate Content
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI-assisted social content generation using brand voice guidelines
        </p>
      </div>

      {/* Configuration */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
            >
              <option value="">Select property (optional)...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Brand Voice Brief</label>
            <select
              value={selectedBrief}
              onChange={(e) => setSelectedBrief(e.target.value)}
              disabled={!selectedProperty}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25 disabled:opacity-50"
            >
              <option value="">None (optional)</option>
              {briefs.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Topic / Content</label>
          <textarea
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
            placeholder="Describe what you want to post about..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Target Platforms</label>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => togglePlatform(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  selectedPlatforms.includes(value)
                    ? PLATFORM_COLORS[value] ?? "bg-zinc-700 text-white border-zinc-600"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !topic.trim() || selectedPlatforms.length === 0}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
              Generating...
            </span>
          ) : (
            "Generate Posts"
          )}
        </button>
      </div>

      {/* Generated results */}
      {generated.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400">
              Generated Posts ({generated.length})
            </h2>
            <button
              onClick={handleSaveAll}
              disabled={saving || !selectedProperty}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All as Drafts"}
            </button>
          </div>

          {generated.map((post, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 space-y-2 ${
                PLATFORM_COLORS[post.platform]?.replace("text-", "border-").split(" ")[2] ?? "border-zinc-800"
              } bg-zinc-900`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[post.platform] ?? "bg-zinc-800 text-zinc-400"}`}>
                  {post.platform}
                </span>
                {post.title && (
                  <input
                    type="text"
                    value={post.title}
                    onChange={(e) => updatePost(i, "title", e.target.value)}
                    className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
                  />
                )}
              </div>
              <textarea
                value={post.body}
                onChange={(e) => updatePost(i, "body", e.target.value)}
                rows={3}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
              />
              {post.hashtags?.length > 0 && (
                <p className="text-xs text-zinc-500">
                  {post.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              )}
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
