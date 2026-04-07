import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cmsConfig } from "@/cms.config";
import { getPublishedContentPages } from "@pandotic/universal-cms/data/content";
import { getFeaturedEntities } from "@pandotic/universal-cms/data/entities";

export default async function HomePage() {
  const supabase = await createClient();
  const { primaryEntity } = cmsConfig;

  const [recentPosts, featuredEntities] = await Promise.all([
    getPublishedContentPages(supabase).then((pages) => pages.slice(0, 3)),
    getFeaturedEntities(supabase).then((entities) => entities.slice(0, 6)),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero — Customize for your site */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {cmsConfig.siteName}
        </h1>
        <p className="mt-4 text-lg text-foreground-secondary">
          {cmsConfig.siteTagline}
        </p>
      </section>

      {/* Featured Entities */}
      {featuredEntities.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            Featured {primaryEntity.plural}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEntities.map((entity) => (
              <Link
                key={entity.id}
                href={`/directory/${entity.slug}`}
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:bg-hover"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {entity.name}
                </h3>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {entity.type}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Blog Posts */}
      {recentPosts.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Latest Posts
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-lg border border-border bg-surface p-6 transition-colors hover:bg-hover"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-foreground-secondary">
                    {post.excerpt}
                  </p>
                )}
                {post.published_at && (
                  <p className="mt-3 text-xs text-foreground-muted">
                    {new Date(post.published_at).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
