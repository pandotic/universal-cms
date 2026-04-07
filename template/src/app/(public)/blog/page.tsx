import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cmsConfig } from "@/cms.config";
import { getPublishedContentPages } from "@pandotic/universal-cms/data/content";

export const metadata: Metadata = {
  title: "Blog",
  description: `Latest articles and guides from ${cmsConfig.siteName}`,
};

export default async function BlogPage() {
  const supabase = await createClient();
  const posts = await getPublishedContentPages(supabase);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-foreground-secondary">No posts yet. Check back soon!</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="border-b border-border pb-8 last:border-0"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold text-foreground hover:text-brand-primary">
                  {post.title}
                </h2>
              </Link>
              {post.excerpt && (
                <p className="mt-2 text-foreground-secondary">{post.excerpt}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-foreground-muted">
                {post.published_at && (
                  <time>{new Date(post.published_at).toLocaleDateString()}</time>
                )}
                <span className="capitalize">{post.page_type}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
