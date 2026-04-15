"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: string;
  client: string | null;
  tagline: string | null;
  updated_at: string;
}

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  status: string;
  updated_at: string;
}

type Tab = "projects" | "pages";

// ─── Supabase Client ─────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Admin Page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [supabase] = useState(() => getSupabase());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white">CMS Not Configured</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Supabase environment variables are not set.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm supabase={supabase as AnySupabaseClient} />;
  }

  return <AdminDashboard supabase={supabase as AnySupabaseClient} user={user} />;
}

// ─── Login Form ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = ReturnType<typeof createClient<any>>;

function LoginForm({
  supabase,
}: {
  supabase: AnySupabaseClient;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/images/pandologo.avif"
            alt="Pandotic"
            width={48}
            height={48}
            className="mx-auto rounded-full"
          />
          <h1 className="mt-4 text-xl font-semibold text-white">CMS Admin</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to manage site content
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

function AdminDashboard({
  supabase,
  user,
}: {
  supabase: AnySupabaseClient;
  user: User;
}) {
  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "projects") {
        const { data, error: err } = await supabase
          .from("projects")
          .select("id, name, slug, status, category, client, tagline, updated_at")
          .order("created_at", { ascending: false });
        if (err) throw err;
        setProjects(data ?? []);
      } else {
        const { data, error: err } = await supabase
          .from("content_pages")
          .select("id, title, slug, page_type, status, updated_at")
          .order("created_at", { ascending: false });
        if (err) throw err;
        setPages(data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase, tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2">
                <img
                  src="/images/pandologo.avif"
                  alt="Pandotic"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-sm font-semibold text-white">
                  CMS Admin
                </span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
          <button
            onClick={() => setTab("projects")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "projects"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setTab("pages")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "pages"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Content Pages
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          </div>
        ) : tab === "projects" ? (
          <ProjectsPanel
            projects={projects}
            supabase={supabase}
            onRefresh={fetchData}
          />
        ) : (
          <PagesPanel
            pages={pages}
            supabase={supabase}
            onRefresh={fetchData}
          />
        )}
      </main>
    </div>
  );
}

// ─── Projects Panel ──────────────────────────────────────────────────────────

function ProjectsPanel({
  projects,
  supabase,
  onRefresh,
}: {
  projects: Project[];
  supabase: AnySupabaseClient;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState<Project | null>(null);

  async function handleStatusToggle(project: Project) {
    const newStatus = project.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", project.id);
    if (!error) onRefresh();
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    await supabase.from("project_sections").delete().eq("project_id", project.id);
    await supabase.from("projects").delete().eq("id", project.id);
    onRefresh();
  }

  if (editing) {
    return (
      <ProjectEditor
        project={editing}
        supabase={supabase}
        onSave={() => {
          setEditing(null);
          onRefresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Projects ({projects.length})
        </h2>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">No projects found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Updated</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(project)}
                      className="text-white hover:text-blue-400 transition-colors font-medium text-left"
                    >
                      {project.name}
                    </button>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      /{project.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {project.category}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusToggle(project)}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                        project.status === "published"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {project.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(project)}
                      className="text-zinc-400 hover:text-white text-xs mr-3 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
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

// ─── Project Editor ──────────────────────────────────────────────────────────

function ProjectEditor({
  project,
  supabase,
  onSave,
  onCancel,
}: {
  project: Project;
  supabase: AnySupabaseClient;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    slug: project.slug,
    category: project.category,
    client: project.client || "",
    tagline: project.tagline || "",
    status: project.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("projects")
      .update({
        name: form.name,
        slug: form.slug,
        category: form.category,
        client: form.client || null,
        tagline: form.tagline || null,
        status: form.status,
      })
      .eq("id", project.id);

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      onSave();
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="text-zinc-400 hover:text-white text-sm"
        >
          &larr; Back
        </button>
        <h2 className="text-lg font-semibold text-white">
          Edit: {project.name}
        </h2>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Client
            </label>
            <input
              type="text"
              value={form.client}
              onChange={(e) =>
                setForm((f) => ({ ...f, client: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Tagline
          </label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) =>
              setForm((f) => ({ ...f, tagline: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Pages Panel ─────────────────────────────────────────────────────────────

function PagesPanel({
  pages,
  supabase,
  onRefresh,
}: {
  pages: ContentPage[];
  supabase: AnySupabaseClient;
  onRefresh: () => void;
}) {
  async function handleStatusToggle(page: ContentPage) {
    const newStatus = page.status === "published" ? "draft" : "published";
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "published") {
      updates.published_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("content_pages")
      .update(updates)
      .eq("id", page.id);
    if (!error) onRefresh();
  }

  async function handleDelete(page: ContentPage) {
    if (!confirm(`Delete page "${page.title}"?`)) return;
    await supabase.from("content_pages").delete().eq("id", page.id);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Content Pages ({pages.length})
        </h2>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">No content pages found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Updated</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{page.title}</span>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      /{page.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">
                    {page.page_type}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusToggle(page)}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                        page.status === "published"
                          ? "bg-green-900/30 text-green-400"
                          : page.status === "archived"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {page.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(page)}
                      className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
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
