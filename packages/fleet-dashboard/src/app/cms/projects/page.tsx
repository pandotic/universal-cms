import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllProjects } from "@pandotic/universal-cms/data/projects";

export const metadata: Metadata = {
  title: "CMS — Projects",
};

export default async function CMSProjectsPage() {
  const supabase = await createClient();
  let projects: Awaited<ReturnType<typeof getAllProjects>> = [];
  let error: string | null = null;

  try {
    projects = await getAllProjects(supabase);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load projects";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage project showcases across all Pandotic sites
          </p>
        </div>
        <Link
          href="/cms/projects/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          New Project
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Client</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {projects.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  No projects found. Create your first project to get started.
                </td>
              </tr>
            )}
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/cms/projects/${project.id}`}
                    className="text-white hover:text-blue-400 transition-colors font-medium"
                  >
                    {project.name}
                  </Link>
                  <p className="text-zinc-500 text-xs mt-0.5">/{project.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-400">{project.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.status === "published"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{project.client || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/cms/projects/${project.id}`}
                    className="text-zinc-400 hover:text-white text-xs transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
