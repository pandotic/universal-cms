"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllProjects,
  updateProject,
  deleteProject,
} from "@pandotic/universal-cms/data/projects";
import type { Project } from "@pandotic/universal-cms/types/projects";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ProjectSectionsEditor } from "./ProjectSectionsEditor";

type EditableFields = Pick<
  Project,
  "name" | "slug" | "category" | "client" | "tagline" | "status"
>;

export default function ProjectsAdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getAllProjects(supabase);
      setProjects(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleStatusToggle(project: Project) {
    const next = project.status === "published" ? "draft" : "published";
    try {
      await updateProject(supabase, project.id, { status: next });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    try {
      // project_sections has FK to projects with cascade in pandotic-site's
      // schema, but we delete sections explicitly to keep behaviour
      // identical to the previous self-rolled admin.
      await supabase
        .from("project_sections")
        .delete()
        .eq("project_id", project.id);
      await deleteProject(supabase, project.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  if (editing) {
    return (
      <ProjectEditor
        project={editing}
        onSave={() => {
          setEditing(null);
          refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Pandotic-specific portfolio entries. {projects.length} total.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground-secondary">No projects found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary text-foreground-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="transition-colors hover:bg-surface-secondary/40"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(project)}
                      className="text-left font-medium text-foreground hover:underline"
                    >
                      {project.name}
                    </button>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      /{project.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {project.category}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusToggle(project)}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        project.status === "published"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-surface-tertiary text-foreground-secondary"
                      }`}
                    >
                      {project.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-tertiary">
                    {project.updated_at
                      ? new Date(project.updated_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(project)}
                      className="mr-3 text-xs text-foreground-secondary transition-colors hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
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

function ProjectEditor({
  project,
  onSave,
  onCancel,
}: {
  project: Project;
  onSave: () => void;
  onCancel: () => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<EditableFields>({
    name: project.name,
    slug: project.slug,
    category: project.category,
    client: project.client ?? "",
    tagline: project.tagline ?? "",
    status: project.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProject(supabase, project.id, {
        name: form.name,
        slug: form.slug,
        category: form.category,
        client: form.client || "",
        tagline: form.tagline || "",
        status: form.status,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="text-sm text-foreground-secondary hover:text-foreground"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-foreground">
          Edit: {project.name}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <Field
            label="Slug"
            value={form.slug}
            onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
          />
          <Field
            label="Category"
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
          <Field
            label="Client"
            value={form.client}
            onChange={(v) => setForm((f) => ({ ...f, client: v }))}
          />
        </div>
        <Field
          label="Tagline"
          value={form.tagline}
          onChange={(v) => setForm((f) => ({ ...f, tagline: v }))}
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as Project["status"],
              }))
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-foreground-secondary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-foreground">Sections</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Markdown content for each section type. Saved into{" "}
          <span className="font-mono text-xs">project_sections</span> and
          parsed by template renderers (case-study, features, proof points, …).
        </p>
        <div className="mt-4">
          <ProjectSectionsEditor projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground-secondary">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none"
      />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}
