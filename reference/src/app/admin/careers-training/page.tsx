import { getSupabaseAdmin } from "@/lib/supabase-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface CountCard {
  label: string;
  count: number;
  href: string;
}

interface RecentItem {
  id: string;
  table: string;
  label: string;
  slug: string;
  updated_at: string;
  is_active?: boolean;
}

export default async function AdminCareersOverviewPage() {
  let cards: CountCard[] = [];
  let recentItems: RecentItem[] = [];
  let error: string | null = null;

  try {
    const supabase = getSupabaseAdmin();

    // Fetch counts in parallel
    const [providers, programs, roles, resources, tags, jobSources] =
      await Promise.all([
        supabase.from("ch_providers").select("id", { count: "exact", head: true }),
        supabase.from("ch_programs").select("id", { count: "exact", head: true }),
        supabase.from("ch_roles").select("id", { count: "exact", head: true }),
        supabase.from("ch_resources").select("id", { count: "exact", head: true }),
        supabase.from("ch_tags").select("id", { count: "exact", head: true }),
        supabase.from("ch_job_sources").select("id", { count: "exact", head: true }),
      ]);

    cards = [
      { label: "Providers", count: providers.count ?? 0, href: "/admin/careers-training/providers" },
      { label: "Programs", count: programs.count ?? 0, href: "/admin/careers-training/programs" },
      { label: "Roles", count: roles.count ?? 0, href: "/admin/careers-training/roles" },
      { label: "Resources", count: resources.count ?? 0, href: "/admin/careers-training/resources" },
      { label: "Tags", count: tags.count ?? 0, href: "/admin/careers-training/tags" },
      { label: "Job Sources", count: jobSources.count ?? 0, href: "/admin/careers-training/job-sources" },
    ];

    // Fetch recent changes across tables
    const [rProviders, rPrograms, rRoles, rResources, rTags, rJobSources] =
      await Promise.all([
        supabase
          .from("ch_providers")
          .select("id, slug, name, updated_at, is_active")
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("ch_programs")
          .select("id, slug, title, updated_at, is_active")
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("ch_roles")
          .select("id, slug, name, updated_at, is_active")
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("ch_resources")
          .select("id, slug, title, updated_at, is_active")
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("ch_tags")
          .select("id, slug, name, updated_at")
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("ch_job_sources")
          .select("id, slug, source_name, updated_at, is_active")
          .order("updated_at", { ascending: false })
          .limit(10),
      ]);

    const all: RecentItem[] = [
      ...(rProviders.data ?? []).map((r) => ({
        id: r.id,
        table: "Provider",
        label: r.name,
        slug: r.slug,
        updated_at: r.updated_at,
        is_active: r.is_active,
      })),
      ...(rPrograms.data ?? []).map((r) => ({
        id: r.id,
        table: "Program",
        label: r.title,
        slug: r.slug,
        updated_at: r.updated_at,
        is_active: r.is_active,
      })),
      ...(rRoles.data ?? []).map((r) => ({
        id: r.id,
        table: "Role",
        label: r.name,
        slug: r.slug,
        updated_at: r.updated_at,
        is_active: r.is_active,
      })),
      ...(rResources.data ?? []).map((r) => ({
        id: r.id,
        table: "Resource",
        label: r.title,
        slug: r.slug,
        updated_at: r.updated_at,
        is_active: r.is_active,
      })),
      ...(rTags.data ?? []).map((r) => ({
        id: r.id,
        table: "Tag",
        label: r.name,
        slug: r.slug,
        updated_at: r.updated_at,
      })),
      ...(rJobSources.data ?? []).map((r) => ({
        id: r.id,
        table: "Job Source",
        label: r.source_name,
        slug: r.slug,
        updated_at: r.updated_at,
        is_active: r.is_active,
      })),
    ];

    all.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    recentItems = all.slice(0, 10);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Count cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.count}</p>
          </Link>
        ))}
      </div>

      {/* Recent changes */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Changes</h2>
        {recentItems.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No items yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Slug
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentItems.map((item) => (
                  <tr key={`${item.table}-${item.id}`} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {item.table}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {item.label}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{item.slug}</td>
                    <td className="px-4 py-2 text-sm">
                      {item.is_active === undefined ? (
                        <span className="text-gray-400">-</span>
                      ) : item.is_active ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
