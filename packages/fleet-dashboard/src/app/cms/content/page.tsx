import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllContentPages } from "@pandotic/universal-cms/data/content";

export const metadata: Metadata = {
  title: "CMS — Content Pages",
};

export default async function CMSContentPage() {
  const supabase = await createClient();
  let pages: Awaited<ReturnType<typeof getAllContentPages>> = [];
  let error: string | null = null;

  try {
    pages = await getAllContentPages(supabase);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load content pages";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Pages</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage blog posts and general content pages
          </p>
        </div>
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
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {pages.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                  No content pages found. Content pages will appear here once the CMS tables are seeded.
                </td>
              </tr>
            )}
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-white font-medium">{page.title}</span>
                  <p className="text-zinc-500 text-xs mt-0.5">/{page.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-400">{page.page_type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      page.status === "published"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {page.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(page.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
