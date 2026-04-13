"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Project, ProjectSection, SectionType } from "@pandotic/universal-cms/types/projects";

const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "product-page", label: "Product Page" },
  { type: "case-study", label: "Case Study" },
  { type: "features", label: "Features" },
  { type: "portfolio", label: "Portfolio" },
  { type: "blurbs", label: "Blurbs" },
  { type: "proof-points", label: "Proof Points" },
  { type: "tech-differentiators", label: "Tech Differentiators" },
];

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const [project, setProject] = useState<Partial<Project>>({
    name: "",
    slug: "",
    client: "",
    tagline: "",
    status: "draft",
    category: "",
    tags: [],
    sort_order: 0,
    has_live_demo: false,
  });
  const [sections, setSections] = useState<Partial<ProjectSection>[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | SectionType>("details");

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/cms/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.project) setProject(data.project);
        if (data.sections) setSections(data.sections);
      })
      .catch(() => setError("Failed to load project"));
  }, [id, isNew]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/cms/projects" : `/api/cms/projects/${id}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (isNew && data.project?.id) {
        router.push(`/cms/projects/${data.project.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project and all its sections?")) return;
    try {
      await fetch(`/api/cms/projects/${id}`, { method: "DELETE" });
      router.push("/cms/projects");
    } catch {
      setError("Delete failed");
    }
  }

  function updateSection(type: SectionType, content: string) {
    setSections((prev) => {
      const existing = prev.find((s) => s.section_type === type);
      if (existing) {
        return prev.map((s) =>
          s.section_type === type ? { ...s, content } : s,
        );
      }
      return [...prev, { section_type: type, content, title: type }];
    });
  }

  function getSectionContent(type: SectionType): string {
    return sections.find((s) => s.section_type === type)?.content || "";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/cms/projects" className="text-zinc-400 hover:text-white text-sm">
            &larr; Projects
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isNew ? "New Project" : project.name || "Edit Project"}
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
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
      <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "details"
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Details
        </button>
        {SECTION_TYPES.map((st) => (
          <button
            key={st.type}
            onClick={() => setActiveTab(st.type)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === st.type
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Name" value={project.name || ""} onChange={(v) => setProject((p) => ({ ...p, name: v }))} />
          <Field label="Slug" value={project.slug || ""} onChange={(v) => setProject((p) => ({ ...p, slug: v }))} />
          <Field label="Client" value={project.client || ""} onChange={(v) => setProject((p) => ({ ...p, client: v }))} />
          <Field label="Category" value={project.category || ""} onChange={(v) => setProject((p) => ({ ...p, category: v }))} />
          <div className="md:col-span-2">
            <Field label="Tagline" value={project.tagline || ""} onChange={(v) => setProject((p) => ({ ...p, tagline: v }))} />
          </div>
          <Field label="Status" value={project.status || "draft"} onChange={(v) => setProject((p) => ({ ...p, status: v as "draft" | "published" }))} type="select" options={["draft", "published"]} />
          <Field label="Sort Order" value={String(project.sort_order || 0)} onChange={(v) => setProject((p) => ({ ...p, sort_order: parseInt(v) || 0 }))} />
          <Field label="Demo URL" value={project.demo_url || ""} onChange={(v) => setProject((p) => ({ ...p, demo_url: v || null }))} />
          <Field label="Live URL" value={project.live_url || ""} onChange={(v) => setProject((p) => ({ ...p, live_url: v || null }))} />
          <Field label="Own Site URL" value={project.own_site_url || ""} onChange={(v) => setProject((p) => ({ ...p, own_site_url: v || null }))} />
          <Field label="Hero Screenshot" value={project.hero_screenshot || ""} onChange={(v) => setProject((p) => ({ ...p, hero_screenshot: v || null }))} />
          <Field label="Tags (comma-separated)" value={(project.tags || []).join(", ")} onChange={(v) => setProject((p) => ({ ...p, tags: v.split(",").map((t) => t.trim()).filter(Boolean) }))} />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={project.has_live_demo || false}
              onChange={(e) => setProject((p) => ({ ...p, has_live_demo: e.target.checked }))}
              className="rounded border-zinc-700"
            />
            <label className="text-zinc-300 text-sm">Has Live Demo</label>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      {activeTab !== "details" && (
        <div>
          <label className="block text-zinc-300 text-sm font-medium mb-2">
            {SECTION_TYPES.find((s) => s.type === activeTab)?.label} — Markdown Content
          </label>
          <textarea
            value={getSectionContent(activeTab as SectionType)}
            onChange={(e) => updateSection(activeTab as SectionType, e.target.value)}
            rows={24}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 font-mono focus:border-blue-500 focus:outline-none resize-y"
            placeholder={`Enter markdown content for ${activeTab}...`}
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "select";
  options?: string[];
}) {
  return (
    <div>
      <label className="block text-zinc-400 text-xs font-medium mb-1.5">{label}</label>
      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
        />
      )}
    </div>
  );
}
