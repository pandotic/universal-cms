import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cmsConfig } from "@/cms.config";
import { getAllEntities } from "@pandotic/universal-cms/data/entities";
import { getAllCategories } from "@pandotic/universal-cms/data/categories";

export const metadata: Metadata = {
  title: cmsConfig.primaryEntity.plural,
  description: `Browse all ${cmsConfig.primaryEntity.plural.toLowerCase()} on ${cmsConfig.siteName}`,
};

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { primaryEntity } = cmsConfig;

  const [entities, categories] = await Promise.all([
    getAllEntities(supabase),
    getAllCategories(supabase),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        {primaryEntity.plural}
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar — Categories */}
        {categories.length > 0 && (
          <aside className="lg:w-64 lg:shrink-0">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
              Categories
            </h2>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <span className="text-sm text-foreground-secondary hover:text-foreground">
                    {cat.name}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Entity Grid */}
        <div className="flex-1">
          {entities.length === 0 ? (
            <p className="text-foreground-secondary">
              No {primaryEntity.plural.toLowerCase()} found.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entities.map((entity) => (
                <Link
                  key={entity.id}
                  href={`/directory/${entity.slug}`}
                  className="rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-hover"
                >
                  <h3 className="font-semibold text-foreground">
                    {entity.name}
                  </h3>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {entity.type}
                  </p>
                  {entity.featured && (
                    <span className="mt-2 inline-block rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                      Featured
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
